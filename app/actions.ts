"use server";

import {
	OpenRouteService,
	type DirectionsGeoJSONResponse,
	type Coordinate,
	type Profile,
} from "ors-client";
import * as turf from "@turf/turf";
import type {
	Preferences,
	RouteSummary,
	RouteGenerationResponse,
	TrafficLightInfo,
	OverpassResponse,
	BoundingBox,
} from "./lib/types";
import {
	SEEDS,
	MIN_ROUTE_LENGTH,
	MAX_ROUTES,
	LIGHTS_NEAR_DISTANCE_METERS,
	PARK_NEAR_DISTANCE_METERS,
	PARK_SAMPLE_COUNT_FACTOR,
	OVERPASS_TIMEOUT_SECONDS,
	DEFAULT_WALKING_SPEED_KMH,
	DISTANCE_PENALTY_WEIGHT,
	LIGHTS_PENALTY_WEIGHT,
	PARKS_BONUS_WEIGHT,
	BASELINE_SCORE,
	MAX_LIGHTS_FOR_PENALTY,
	FEATURES,
} from "./lib/constants";
import { generateId, sleep } from "./lib/utils";

/**
 * Server action to find running routes based on preferences
 * @param start - Starting coordinate [longitude, latitude]
 * @param preferences - User preferences for route generation
 * @returns Route generation response with routes and metadata
 */
export async function findRoutes(
	start: Coordinate,
	preferences: Preferences,
): Promise<RouteGenerationResponse> {
	const startTime = Date.now();
	const requestId = generateId();

	try {
		const apiKey = process.env.ORS_API_KEY;
		if (!apiKey) {
			throw new Error("Missing ORS_API_KEY environment variable");
		}

		const ors = new OpenRouteService({ apiKey });

		// Generate multiple route candidates with different seeds
		const candidates = (
			await Promise.allSettled(
				SEEDS.map((seed) =>
					orsRoundTrip(ors, start, preferences.distanceMeters, seed),
				),
			)
		).flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));

		if (!candidates.length) {
			throw new Error("Failed to generate any routes. Please try again.");
		}

		// Enrich routes with traffic lights and park adjacency data
		// Process sequentially to avoid rate limiting
		const enriched: RouteSummary[] = [];

		for (let i = 0; i < candidates.length; i++) {
			const route = candidates[i];
			if (!route) continue;

			const feature = route.features[0];
			if (!feature) {
				console.warn("Invalid route response: no features found");
				continue;
			}

			const lineGeom = feature.geometry as GeoJSON.LineString;

			// Extract distance and duration from feature properties
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
				duration =
					summary.duration ?? distance / (DEFAULT_WALKING_SPEED_KMH / 3.6);
			} else {
				distance =
					turf.length(feature as GeoJSON.Feature, { units: "kilometers" }) *
					1000;
				duration = distance / (DEFAULT_WALKING_SPEED_KMH / 3.6);
			}

			const bbox = turf.bbox(feature as GeoJSON.Feature) as BoundingBox;

			// Only fetch traffic lights and parks if features are enabled
			// This avoids Overpass API rate limiting issues
			let trafficLights: TrafficLightInfo = { count: 0, positions: [] };
			let parkAdj = 0;

			if (FEATURES.ENABLE_TRAFFIC_LIGHTS_CHECK) {
				trafficLights = await trafficLightsNearRoute(bbox, lineGeom).catch(
					(err) => {
						console.warn("Failed to fetch traffic lights:", err.message);
						return { count: 0, positions: [] as Coordinate[] };
					},
				);
				// Add delay between requests to avoid rate limiting
				await sleep(500);
			}

			if (FEATURES.ENABLE_PARK_ADJACENCY_CHECK) {
				parkAdj = await parkAdjacency(bbox, lineGeom).catch((err) => {
					console.warn("Failed to fetch park adjacency:", err.message);
					return 0;
				});
			}

			// Calculate score
			const target = preferences.distanceMeters;
			const distancePenalty = Math.min(
				1,
				Math.abs(distance - target) / Math.max(1, target),
			);

			// Calculate score based on enabled features
			let score =
				100 - DISTANCE_PENALTY_WEIGHT * distancePenalty + BASELINE_SCORE;

			// Add traffic lights penalty if feature is enabled
			if (FEATURES.ENABLE_TRAFFIC_LIGHTS_CHECK) {
				score -=
					LIGHTS_PENALTY_WEIGHT *
					preferences.avoidTrafficLights *
					Math.min(1, trafficLights.count / MAX_LIGHTS_FOR_PENALTY);
			}

			// Add park bonus if feature is enabled
			if (FEATURES.ENABLE_PARK_ADJACENCY_CHECK) {
				score += PARKS_BONUS_WEIGHT * preferences.preferParks * parkAdj;
			}

			const routeSummary: RouteSummary = {
				id: i,
				geojson: route,
				distance,
				duration,
				trafficLights,
				parkAdjacency: parkAdj,
				score: Math.max(0, Math.min(100, score)) / 100,
				metadata: {
					seedUsed: SEEDS[i] || 0,
					generatedAt: new Date(),
					apiVersion: "1.0.0",
				},
			};

			enriched.push(routeSummary);
		}

		// Check if we have any valid routes after enrichment
		if (enriched.length === 0) {
			throw new Error(
				"Failed to generate routes. All route candidates were invalid.",
			);
		}

		// Sort by score and return top routes
		const sortedRoutes = enriched
			.sort((a, b) => b.score - a.score)
			.slice(0, MAX_ROUTES);

		return {
			routes: sortedRoutes,
			metadata: {
				requestId,
				processingTimeMs: Date.now() - startTime,
				apiCalls: SEEDS.length,
			},
		};
	} catch (error) {
		console.error("Route generation error:", error);

		// Provide user-friendly error messages
		if (error instanceof Error) {
			if (error.message.includes("rate limit")) {
				throw new Error(
					"OpenStreetMap data service is currently busy. Please wait 30 seconds and try again.",
				);
			}
			if (error.message.includes("quota")) {
				throw new Error(
					"Too many requests. Please wait a moment and try again.",
				);
			}
			throw new Error(error.message);
		}

		throw new Error("An unexpected error occurred while generating routes");
	}
}

/**
 * Generate a round trip route using OpenRouteService
 */
async function orsRoundTrip(
	ors: OpenRouteService,
	start: Coordinate,
	distanceMeters: number,
	seed: number,
): Promise<DirectionsGeoJSONResponse> {
	try {
		const profile: Profile = "foot-walking";
		const request = {
			coordinates: [start],
			options: {
				round_trip: {
					length: Math.max(MIN_ROUTE_LENGTH, Math.round(distanceMeters)),
					seed,
				},
			} as Record<string, unknown>,
		};

		const response = await ors.directions.calculateRouteGeoJSON(
			profile,
			request,
		);
		return response;
	} catch (error) {
		console.error("ORS round trip error:", error);
		throw error;
	}
}

/**
 * Count traffic lights near the route
 */
async function trafficLightsNearRoute(
	bbox: BoundingBox,
	lineGeom: GeoJSON.LineString,
): Promise<TrafficLightInfo> {
	const [minX, minY, maxX, maxY] = bbox;
	const query = `
    [out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];
    node["highway"="traffic_signals"](${minY},${minX},${maxY},${maxX});
    out body;
  `;

	const response = await overpass(query);
	const positions: Coordinate[] = [];
	let count = 0;

	for (const el of response.elements) {
		if (el.type === "node" && el.lon !== undefined && el.lat !== undefined) {
			const point = turf.point([el.lon, el.lat]);
			const distance = turf.pointToLineDistance(point, lineGeom, {
				units: "meters",
			});

			if (distance <= LIGHTS_NEAR_DISTANCE_METERS) {
				count++;
				positions.push([el.lon, el.lat]);
			}
		}
	}

	return { count, positions };
}

/**
 * Calculate park adjacency score (0 to 1)
 */
async function parkAdjacency(
	bbox: BoundingBox,
	lineGeom: GeoJSON.LineString,
): Promise<number> {
	const [minX, minY, maxX, maxY] = bbox;
	const query = `
    [out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];
    (
      way["leisure"="park"](${minY},${minX},${maxY},${maxX});
      relation["leisure"="park"](${minY},${minX},${maxY},${maxX});
    );
    out geom;
  `;

	const response = await overpass(query);
	const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

	for (const el of response.elements) {
		if (el.type === "way" && el.geometry && el.geometry.length >= 3) {
			const coords = el.geometry.map((g) => [g.lon, g.lat] as Coordinate);
			features.push(
				turf.lineString(coords) as GeoJSON.Feature<GeoJSON.LineString>,
			);
		} else if (el.type === "relation" && el.members) {
			const coords = el.members
				.filter((m) => m.geometry && m.geometry.length > 0)
				.flatMap((m) => {
					if (m.geometry) {
						return m.geometry.map((g) => [g.lon, g.lat] as Coordinate);
					}
					return [];
				});

			if (coords.length >= 3) {
				features.push(
					turf.lineString(coords) as GeoJSON.Feature<GeoJSON.LineString>,
				);
			}
		}
	}

	if (!features.length) return 0;

	const line = turf.lineString(lineGeom.coordinates);
	const lineLenM = turf.length(line, { units: "kilometers" }) * 1000;
	const samples = Math.max(
		100,
		Math.min(400, Math.round(lineLenM / PARK_SAMPLE_COUNT_FACTOR)),
	);

	let hits = 0;
	for (let i = 0; i <= samples; i++) {
		const pt = turf.along(line, (lineLenM * (i / samples)) / 1000, {
			units: "kilometers",
		});
		const near = features.some(
			(f) =>
				turf.pointToLineDistance(pt, f, { units: "meters" }) <=
				PARK_NEAR_DISTANCE_METERS,
		);
		if (near) hits++;
	}

	return hits / samples;
}

/**
 * Query Overpass API with retry logic
 */
async function overpass(query: string, retries = 2): Promise<OverpassResponse> {
	const body = new URLSearchParams({ data: query }).toString();

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const res = await fetch("https://overpass-api.de/api/interpreter", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				},
				body,
			});

			if (!res.ok) {
				const text = await res.text();

				// Check if rate limited
				if (text.includes("rate_limited") || text.includes("quota")) {
					if (attempt < retries) {
						// Wait longer before retry (exponential backoff)
						const delay = Math.pow(2, attempt) * 1000;
						console.warn(`Overpass rate limited, retrying in ${delay}ms...`);
						await sleep(delay);
						continue;
					}
					throw new Error(
						"Overpass API rate limit exceeded. Please try again in a few moments.",
					);
				}

				// Other error
				throw new Error(`Overpass API error: ${res.status}`);
			}

			return (await res.json()) as OverpassResponse;
		} catch (error) {
			if (attempt === retries) {
				throw error;
			}
			// Wait before retry
			await sleep(1000);
		}
	}

	throw new Error("Failed to query Overpass API after retries");
}
