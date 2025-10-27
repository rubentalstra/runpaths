"use server";

import {
	OpenRouteService,
	type DirectionsGeoJSONResponse,
	type Coordinate,
} from "ors-client";
import * as turf from "@turf/turf";
import type { Prefs, TrafficLightResult, OverpassResponse } from "./types";

export async function findRoutes(start: Coordinate, prefs: Prefs) {
	const apiKey = process.env.ORS_API_KEY;
	if (!apiKey) {
		throw new Error("Missing ORS_API_KEY environment variable");
	}

	const ors = new OpenRouteService({ apiKey });
	const seeds = [11, 22, 33, 44, 55];

	const candidates = (
		await Promise.allSettled(
			seeds.map((seed) => orsRoundTrip(ors, start, prefs.distanceMeters, seed)),
		)
	).flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));

	if (!candidates.length) {
		throw new Error("Failed to generate any routes. Please try again.");
	}

	const enriched = await Promise.all(
		candidates.map(async (route, i) => {
			const routeData = route;
			const feature = routeData.features?.[0];
			if (!feature) {
				throw new Error("Invalid route response: no features found");
			}

			const lineGeom = feature.geometry;

			// Get distance and duration from feature properties or calculate fallback
			let distance: number;
			let duration: number;

			if (
				feature.properties &&
				typeof feature.properties === "object" &&
				"summary" in feature.properties
			) {
				const summary = feature.properties.summary as {
					distance?: number;
					duration?: number;
				};
				distance =
					summary.distance ??
					turf.length(feature as GeoJSON.Feature, { units: "kilometers" }) *
						1000;
				duration = summary.duration ?? distance / (5 / 3.6); // 5km/h default if missing
			} else {
				distance =
					turf.length(feature as GeoJSON.Feature, { units: "kilometers" }) *
					1000;
				duration = distance / (5 / 3.6); // 5km/h default
			}

			const bbox = turf.bbox(feature as GeoJSON.Feature);
			const nearLights = await trafficLightsNearRoute(
				bbox as [number, number, number, number],
				lineGeom as GeoJSON.LineString,
			);
			const parkAdj = await parkAdjacency(
				bbox as [number, number, number, number],
				lineGeom as GeoJSON.LineString,
			);

			// score
			const target = prefs.distanceMeters;
			const distancePenalty = Math.min(
				1,
				Math.abs(distance - target) / Math.max(1, target),
			);
			const score =
				100 -
				40 * distancePenalty -
				25 * prefs.avoidLights * Math.min(1, nearLights.count / 20) +
				25 * prefs.preferParks * parkAdj +
				10 * 1; // baseline niceness

			return {
				id: i,
				geojson: routeData,
				dist: distance,
				duration: duration,
				lights: nearLights.count,
				parkAdjacency: parkAdj,
				score: Math.max(0, Math.min(100, score)) / 100,
				lightsPositions: nearLights.positions,
			};
		}),
	);

	// sort and pick top 3
	const routes = enriched.sort((a, b) => b.score - a.score).slice(0, 3);
	return { routes };
} // --- Helpers ---

async function orsRoundTrip(
	ors: OpenRouteService,
	start: Coordinate,
	distanceMeters: number,
	seed: number,
): Promise<DirectionsGeoJSONResponse> {
	try {
		// Create the request - round_trip is supported by ORS API
		const request = {
			coordinates: [start],
			options: {
				round_trip: {
					length: Math.max(800, Math.round(distanceMeters)),
					seed,
				},
			} as Record<string, unknown>,
		};

		const response = await ors.directions.calculateRouteGeoJSON(
			"foot-walking",
			request,
		);
		return response;
	} catch (error) {
		console.error("ORS round trip error:", error);
		throw error;
	}
}

async function trafficLightsNearRoute(
	bbox: [number, number, number, number],
	lineGeom: GeoJSON.Geometry,
): Promise<TrafficLightResult> {
	const [minX, minY, maxX, maxY] = bbox;
	const query = `
    [out:json][timeout:25];
    node["highway"="traffic_signals"](${minY},${minX},${maxY},${maxX});
    out body;
  `;
	const r = await overpass(query);
	const positions: Coordinate[] = [];
	let count = 0;
	for (const el of r.elements ?? []) {
		if (el.type === "node" && el.lon !== undefined && el.lat !== undefined) {
			const p = turf.point([el.lon, el.lat]);
			const d = turf.pointToLineDistance(p, lineGeom as GeoJSON.LineString, {
				units: "meters",
			});
			if (d <= 20) {
				// within 20m of the route line
				count++;
				positions.push([el.lon, el.lat]);
			}
		}
	}
	return { count, positions };
}

async function parkAdjacency(
	bbox: [number, number, number, number],
	lineGeom: GeoJSON.Geometry,
): Promise<number> {
	// We approximate "runs near/in a park" by sampling along the line and checking
	// if the sample point is within 40m of any park outline (leisure=park).
	const [minX, minY, maxX, maxY] = bbox;
	const query = `
    [out:json][timeout:25];
    (
      way["leisure"="park"](${minY},${minX},${maxY},${maxX});
      relation["leisure"="park"](${minY},${minX},${maxY},${maxX});
    );
    out geom;
  `;
	const r = await overpass(query);
	const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
	for (const el of r.elements ?? []) {
		if (el.type === "way" && el.geometry && el.geometry.length >= 3) {
			const coords = el.geometry.map((g) => [g.lon, g.lat] as Coordinate);
			features.push(
				turf.lineString(coords) as GeoJSON.Feature<GeoJSON.LineString>,
			);
		} else if (el.type === "relation" && el.members) {
			// very rough: collect member ways as polylines
			const coords =
				el.members
					?.filter((m) => m.geometry && m.geometry.length > 0)
					?.flatMap((m) => {
						if (m.geometry) {
							return m.geometry.map((g) => [g.lon, g.lat] as Coordinate);
						}
						return [];
					}) ?? [];
			if (coords.length >= 3) {
				features.push(
					turf.lineString(coords) as GeoJSON.Feature<GeoJSON.LineString>,
				);
			}
		}
	}
	if (!features.length) return 0;

	const line = turf.lineString((lineGeom as GeoJSON.LineString).coordinates);
	const lineLenM = turf.length(line, { units: "kilometers" }) * 1000;
	const samples = Math.max(100, Math.min(400, Math.round(lineLenM / 25))); // ~one sample/25m
	let hits = 0;
	for (let i = 0; i <= samples; i++) {
		const pt = turf.along(line, (lineLenM * (i / samples)) / 1000, {
			units: "kilometers",
		});
		const near = features.some(
			(f) => turf.pointToLineDistance(pt, f, { units: "meters" }) <= 40,
		);
		if (near) hits++;
	}
	return hits / samples; // 0..1
}

async function overpass(query: string): Promise<OverpassResponse> {
	const body = new URLSearchParams({ data: query }).toString();
	const res = await fetch("https://overpass-api.de/api/interpreter", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
		},
		body,
	});
	if (!res.ok) {
		const t = await res.text();
		throw new Error("Overpass error: " + t);
	}
	return (await res.json()) as OverpassResponse;
}
