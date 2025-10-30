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
	MAX_ROUTES,
	PARK_NEAR_DISTANCE_METERS,
	PARK_SAMPLE_COUNT_FACTOR,
	OVERPASS_TIMEOUT_SECONDS,
	DEFAULT_PACE_MIN_PER_KM,
	DISTANCE_PENALTY_WEIGHT,
	LIGHTS_PENALTY_WEIGHT,
	PARKS_BONUS_WEIGHT,
	MAX_LIGHTS_FOR_PENALTY,
	FEATURES,
} from "./lib/constants";
import { generateId, sleep } from "./lib/utils";

const DEFAULT_SPEED_KMH = 60 / DEFAULT_PACE_MIN_PER_KM;

/**
 * Server action to find running routes based on user preferences.
 *
 * Generates multiple route candidates using different seeds, enriches them with
 * traffic light and park adjacency data, scores them, and returns the top routes.
 *
 * @param start - Starting coordinate [longitude, latitude]
 * @param preferences - User preferences for route generation (distance, traffic lights, parks, pace)
 * @returns Route generation response containing sorted routes with metadata
 * @throws {Error} When ORS API key is missing or route generation fails
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
				duration = summary.duration ?? distance / (DEFAULT_SPEED_KMH / 3.6);
			} else {
				distance =
					turf.length(feature as GeoJSON.Feature, { units: "kilometers" }) *
					1000;
				duration = distance / (DEFAULT_SPEED_KMH / 3.6);
			}

			const bbox = turf.bbox(feature as GeoJSON.Feature) as BoundingBox;

			let trafficLights: TrafficLightInfo = { count: 0, positions: [] };
			let parkAdj = 0;

			if (FEATURES.ENABLE_TRAFFIC_LIGHTS_CHECK) {
				trafficLights = await trafficLightsNearRoute(bbox, lineGeom).catch(
					(err) => {
						console.warn("Failed to estimate traffic lights:", err.message);
						return { count: 0, positions: [] as Coordinate[] };
					},
				);
			}

			if (FEATURES.ENABLE_PARK_ADJACENCY_CHECK) {
				parkAdj = await parkAdjacency(bbox, lineGeom).catch((err) => {
					console.warn("Failed to fetch park adjacency:", err.message);
					return 0;
				});
			}

			const target = preferences.distanceMeters;
			const distanceDiff = Math.abs(distance - target);
			const distancePenaltyRatio = distanceDiff / Math.max(1, target);
			const distancePenalty = Math.min(1, distancePenaltyRatio * 5);

			let score = 100;

			score -= DISTANCE_PENALTY_WEIGHT * distancePenalty;

			if (FEATURES.ENABLE_TRAFFIC_LIGHTS_CHECK) {
				score -=
					LIGHTS_PENALTY_WEIGHT *
					preferences.avoidTrafficLights *
					Math.min(1, trafficLights.count / MAX_LIGHTS_FOR_PENALTY);
			}

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

		if (enriched.length === 0) {
			throw new Error(
				"Failed to generate routes. All route candidates were invalid.",
			);
		}

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
 * Generates a round trip route using OpenRouteService API.
 *
 * @param ors - OpenRouteService instance
 * @param start - Starting coordinate [longitude, latitude]
 * @param distanceMeters - Target distance in meters
 * @param seed - Seed for route variation
 * @returns GeoJSON response containing the route
 * @throws {Error} When ORS API call fails
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
					length: Math.round(distanceMeters),
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
 * Fetches traffic light locations near a route from OpenStreetMap.
 *
 * Uses OSM's XML API to retrieve traffic signals within the route's bounding box.
 * Falls back to heuristic estimation if the API is unavailable or the bbox is too large.
 *
 * @param bbox - Bounding box [minX, minY, maxX, maxY]
 * @param lineGeom - Route geometry as GeoJSON LineString
 * @returns Traffic light information with count and positions
 */
async function trafficLightsNearRoute(
	bbox: BoundingBox,
	lineGeom: GeoJSON.LineString,
): Promise<TrafficLightInfo> {
	const [minX, minY, maxX, maxY] = bbox;

	const bboxWidth = maxX - minX;
	const bboxHeight = maxY - minY;

	if (bboxWidth > 0.05 || bboxHeight > 0.05) {
		console.log("Bbox too large for OSM API, using heuristic");
		return fallbackTrafficLightEstimate(lineGeom);
	}

	try {
		const osmUrl = `https://www.openstreetmap.org/api/0.6/map?bbox=${minX},${minY},${maxX},${maxY}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		const response = await fetch(osmUrl, {
			signal: controller.signal,
			headers: {
				"User-Agent": "RunPaths-App/1.0",
			},
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			console.warn(`OSM API returned ${response.status}, using heuristic`);
			return fallbackTrafficLightEstimate(lineGeom);
		}

		const xmlText = await response.text();

		const trafficLightRegex =
			/<node[^>]*id="(\d+)"[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>[\s\S]*?<tag k="highway" v="traffic_signals"\/>/g;

		const positions: Coordinate[] = [];
		let match: RegExpExecArray | null = null;

		match = trafficLightRegex.exec(xmlText);
		while (match !== null) {
			const lon = parseFloat(match[3]);
			const lat = parseFloat(match[2]);

			const point = turf.point([lon, lat]);
			const distance = turf.pointToLineDistance(point, lineGeom, {
				units: "meters",
			});

			if (distance <= 30) {
				positions.push([lon, lat]);
			}

			match = trafficLightRegex.exec(xmlText);
		}

		console.log(`Found ${positions.length} traffic lights from OSM`);

		return {
			count: positions.length,
			positions: positions,
		};
	} catch (fetchError) {
		console.warn("OSM API failed, using heuristic:", fetchError);
		return fallbackTrafficLightEstimate(lineGeom);
	}
}

/**
 * Estimates traffic light locations using bearing changes as a heuristic.
 *
 * Significant direction changes (>30 degrees) often indicate intersections
 * where traffic lights may be present.
 *
 * @param lineGeom - Route geometry as GeoJSON LineString
 * @returns Estimated traffic light information
 */
function fallbackTrafficLightEstimate(
	lineGeom: GeoJSON.LineString,
): TrafficLightInfo {
	const positions: Coordinate[] = [];
	const coords = lineGeom.coordinates;

	// Calculate bearing changes (turns) which often indicate intersections
	let significantTurns = 0;
	for (let i = 1; i < coords.length - 1; i++) {
		const bearing1 = turf.bearing(coords[i - 1], coords[i]);
		const bearing2 = turf.bearing(coords[i], coords[i + 1]);
		const angleDiff = Math.abs(bearing2 - bearing1);

		// If the angle change is significant (> 30 degrees), it's likely an intersection
		if (angleDiff > 30 && angleDiff < 330) {
			significantTurns++;
			// Add this as a potential traffic light location
			if (positions.length < 50) {
				// Cap at 50 markers
				positions.push(coords[i] as Coordinate);
			}
		}
	}

	// Estimate traffic lights as ~40% of significant turns for urban routes
	const estimatedCount = Math.round(significantTurns * 0.4);

	return {
		count: estimatedCount,
		positions: positions.slice(0, estimatedCount),
	};
}

/**
 * Calculates park adjacency score for a route.
 *
 * Queries Overpass API for parks within the route's bounding box, then samples
 * points along the route to determine what percentage is near a park.
 *
 * @param bbox - Bounding box [minX, minY, maxX, maxY]
 * @param lineGeom - Route geometry as GeoJSON LineString
 * @returns Park adjacency score from 0 to 1
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
 * Queries Overpass API with retry logic and exponential backoff.
 *
 * @param query - Overpass QL query string
 * @param retries - Number of retry attempts (default: 2)
 * @returns Overpass API response
 * @throws {Error} When API call fails after all retries
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

				if (text.includes("rate_limited") || text.includes("quota")) {
					if (attempt < retries) {
						const delay = Math.pow(2, attempt) * 1000;
						console.warn(`Overpass rate limited, retrying in ${delay}ms...`);
						await sleep(delay);
						continue;
					}
					throw new Error(
						"Overpass API rate limit exceeded. Please try again in a few moments.",
					);
				}

				throw new Error(`Overpass API error: ${res.status}`);
			}

			return (await res.json()) as OverpassResponse;
		} catch (error) {
			if (attempt === retries) {
				throw error;
			}
			await sleep(1000);
		}
	}

	throw new Error("Failed to query Overpass API after retries");
}
