/**
 * Application-wide constants for configuration and feature flags.
 *
 * @module constants
 */

export const DEFAULT_MAP_CENTER: [number, number] = [4.8952, 52.3702];
export const DEFAULT_MAP_ZOOM = 12;
export const MAP_PADDING = 80;
export const MAP_ANIMATION_DURATION = 600;

export const GEOLOCATION_TIMEOUT_MS = 10000;
export const GEOLOCATION_MAXIMUM_AGE_MS = 300000;

export const DEFAULT_DISTANCE_KM = 5;
export const MIN_DISTANCE_KM = 1;
export const MAX_DISTANCE_KM = 25;
export const DISTANCE_STEP = 0.5;

export const DEFAULT_AVOID_LIGHTS = 0.8;
export const DEFAULT_PREFER_PARKS = 0.7;
export const PREFERENCE_STEP = 0.05;
export const MIN_PREFERENCE = 0;
export const MAX_PREFERENCE = 1;

export const QUICK_DISTANCES = [3, 5, 10, 15] as const;

export const DISTANCE_PENALTY_WEIGHT = 40;
export const LIGHTS_PENALTY_WEIGHT = 25;
export const PARKS_BONUS_WEIGHT = 25;

export const SEEDS = [11, 22, 33, 44, 55] as const;
export const MAX_ROUTES = 4;

export const LIGHTS_NEAR_DISTANCE_METERS = 20;
export const MAX_LIGHTS_FOR_PENALTY = 20;

export const PARK_NEAR_DISTANCE_METERS = 40;
export const PARK_SAMPLE_COUNT_FACTOR = 25;

export const OVERPASS_TIMEOUT_SECONDS = 15;

export const DEFAULT_PACE_MIN_PER_KM = 6;
export const MIN_PACE_MIN_PER_KM = 3;
export const MAX_PACE_MIN_PER_KM = 10;
export const PACE_STEP = 0.25;

export const DEFAULT_COLORBLIND_MODE = false;

export const ROUTE_COLORS = {
	default: {
		primary: "#0077BB",
		alternative: "#1D282D",
		trafficLight: "#DC2626",
		trafficLightBg: "#FEE2E2",
	},
	colorblind: {
		primary: "#0077BB",
		alternative: "#555555",
		trafficLight: "#EE7733",
		trafficLightBg: "#FFE5D0",
	},
} as const;

export const TOAST_DURATION_MS = 5000;
export const MAX_TOASTS = 5;

export const ERROR_CODES = {
	ROUTE_GENERATION_FAILED: "ROUTE_GENERATION_FAILED",
	GEOLOCATION_DENIED: "GEOLOCATION_DENIED",
	GEOLOCATION_TIMEOUT: "GEOLOCATION_TIMEOUT",
	GEOLOCATION_UNAVAILABLE: "GEOLOCATION_UNAVAILABLE",
	API_TIMEOUT: "API_TIMEOUT",
	NETWORK_ERROR: "NETWORK_ERROR",
} as const;

export const FEATURES = {
	ENABLE_ROUTE_CACHING: true,
	ENABLE_ADVANCED_SCORING: true,
	ENABLE_ROUTE_CLUSTERING: false,
	ENABLE_OFFLINE_MODE: false,
	ENABLE_TRAFFIC_LIGHTS_CHECK: false,
	ENABLE_PARK_ADJACENCY_CHECK: false,
} as const;
