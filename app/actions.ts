"use server";

import * as turf from "@turf/turf";

type Prefs = {
	distanceMeters: number;
	avoidLights: number;
	preferParks: number;
};

export async function findRoutes(start: [number, number], prefs: Prefs) {
	const apiKey = process.env.ORS_API_KEY;
	if (!apiKey) {
		throw new Error("Missing ORS_API_KEY");
	}
	const seeds = [11, 22, 33, 44, 55];
	const candidates = (
		await Promise.allSettled(
			seeds.map((seed) => orsRoundTrip(start, prefs.distanceMeters, seed)),
		)
	).flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));

	if (!candidates.length) {
		return { routes: [] };
	}

	const enriched = await Promise.all(
		candidates.map(async (route, i) => {
			const feature = route.features?.[0] ?? route;
			const lineGeom = feature.geometry;
			const distance =
				feature.properties?.summary?.distance ??
				turf.length(feature as GeoJSON.Feature, { units: "kilometers" }) * 1000;
			const duration =
				feature.properties?.summary?.duration ?? distance / (5 / 3.6); // 5km/h default if missing

			const bbox = turf.bbox(feature as GeoJSON.Feature);
			const nearLights = await trafficLightsNearRoute(
				bbox as [number, number, number, number],
				lineGeom,
			);
			const parkAdj = await parkAdjacency(
				bbox as [number, number, number, number],
				lineGeom,
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
				geojson: route,
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
}

// --- Helpers ---

async function orsRoundTrip(
	start: [number, number],
	distanceMeters: number,
	seed: number,
) {
	const body = {
		coordinates: [start],
		format: "geojson",
		profile: "foot-walking",
		options: {
			round_trip: {
				length: Math.max(800, Math.round(distanceMeters)),
				seed,
			},
			// You can experiment with green/quiet weighting via profile_params
			// profile_params: { weightings: { green: 0.7, quiet: 0.3 } }
		},
	};
	const res = await fetch(
		"https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: process.env.ORS_API_KEY as string,
			},
			body: JSON.stringify(body),
		},
	);
	if (!res.ok) {
		const txt = await res.text();
		throw new Error("OpenRouteService error: " + txt);
	}
	const data = await res.json();
	return data; // FeatureCollection with [0] line + properties.summary
}

async function trafficLightsNearRoute(
	bbox: [number, number, number, number],
	lineGeom: GeoJSON.Geometry,
) {
	const [minX, minY, maxX, maxY] = bbox;
	const query = `
    [out:json][timeout:25];
    node["highway"="traffic_signals"](${minY},${minX},${maxY},${maxX});
    out body;
  `;
	const r = await overpass(query);
	const positions: [number, number][] = [];
	let count = 0;
	for (const el of r.elements ?? []) {
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
	return { count, positions };
}

async function parkAdjacency(
	bbox: [number, number, number, number],
	lineGeom: GeoJSON.Geometry,
) {
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
		if (el.type === "way" && el.geometry?.length >= 3) {
			const coords = el.geometry.map((g: { lat: number; lon: number }) => [
				g.lon,
				g.lat,
			]);
			features.push(
				turf.lineString(coords) as GeoJSON.Feature<GeoJSON.LineString>,
			);
		} else if (el.type === "relation" && el.members) {
			// very rough: collect member ways as polylines
			const coords =
				el.members
					?.filter(
						(m: { geometry?: { lat: number; lon: number }[] }) => m.geometry,
					)
					?.flatMap((m: { geometry: { lat: number; lon: number }[] }) =>
						m.geometry.map((g) => [g.lon, g.lat]),
					) ?? [];
			if (coords.length >= 3)
				features.push(
					turf.lineString(coords) as GeoJSON.Feature<GeoJSON.LineString>,
				);
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

async function overpass(query: string) {
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
	return await res.json();
}
