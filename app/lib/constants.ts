// Map configuration
export const DEFAULT_MAP_CENTER: [number, number] = [4.8952, 52.3702]; // Amsterdam
export const DEFAULT_MAP_ZOOM = 12;
export const MAP_PADDING = 80;
export const MAP_ANIMATION_DURATION = 600;

// Geolocation configuration
export const GEOLOCATION_TIMEOUT_MS = 10000;
export const GEOLOCATION_MAXIMUM_AGE_MS = 300000; // 5 minutes

// Route configuration
export const DEFAULT_DISTANCE_KM = 5;
export const MIN_DISTANCE_KM = 1;
export const MAX_DISTANCE_KM = 25;
export const DISTANCE_STEP = 0.5;

// Preferences
export const DEFAULT_AVOID_LIGHTS = 0.8;
export const DEFAULT_PREFER_PARKS = 0.7;
export const PREFERENCE_STEP = 0.05;
export const MIN_PREFERENCE = 0;
export const MAX_PREFERENCE = 1;

// Quick distance presets
export const QUICK_DISTANCES = [3, 5, 10, 15] as const;

// Scoring weights
export const DISTANCE_PENALTY_WEIGHT = 40;
export const LIGHTS_PENALTY_WEIGHT = 25;
export const PARKS_BONUS_WEIGHT = 25;
export const BASELINE_SCORE = 10;

// Route generation
export const SEEDS = [11, 22, 33, 44, 55] as const;
export const MAX_ROUTES = 3;

// Traffic lights
export const LIGHTS_NEAR_DISTANCE_METERS = 20;
export const MAX_LIGHTS_FOR_PENALTY = 20;

// Parks
export const PARK_NEAR_DISTANCE_METERS = 40;
export const PARK_SAMPLE_COUNT_FACTOR = 25; // samples per 25m

// API timeouts
export const OVERPASS_TIMEOUT_SECONDS = 15; // Reduced from 25 to fail faster

// Default running pace for duration estimation (minutes per km)
export const DEFAULT_PACE_MIN_PER_KM = 6; // 6 min/km = 10 km/h
export const MIN_PACE_MIN_PER_KM = 3; // Fast runner: 3 min/km = 20 km/h
export const MAX_PACE_MIN_PER_KM = 10; // Slow jogger: 10 min/km = 6 km/h
export const PACE_STEP = 0.25; // 15 seconds

// Colorblind mode
export const DEFAULT_COLORBLIND_MODE = false;

// Color schemes for routes
export const ROUTE_COLORS = {
	default: {
		primary: "#0077BB", // Blue
		alternative: "#1D282D", // Dark gray
		trafficLight: "#DC2626", // Red
		trafficLightBg: "#FEE2E2", // Light red background
	},
	colorblind: {
		primary: "#0077BB", // Blue (deuteranopia/protanopia safe)
		alternative: "#555555", // Medium gray
		trafficLight: "#EE7733", // Orange (safe for most colorblind types)
		trafficLightBg: "#FFE5D0", // Light orange background
	},
} as const;

// Toast configuration
export const TOAST_DURATION_MS = 5000;
export const MAX_TOASTS = 5;

// Error codes
export const ERROR_CODES = {
	ROUTE_GENERATION_FAILED: "ROUTE_GENERATION_FAILED",
	GEOLOCATION_DENIED: "GEOLOCATION_DENIED",
	GEOLOCATION_TIMEOUT: "GEOLOCATION_TIMEOUT",
	GEOLOCATION_UNAVAILABLE: "GEOLOCATION_UNAVAILABLE",
	API_TIMEOUT: "API_TIMEOUT",
	NETWORK_ERROR: "NETWORK_ERROR",
} as const;

// Feature flags (for future use)
export const FEATURES = {
	ENABLE_ROUTE_CACHING: true,
	ENABLE_ADVANCED_SCORING: true,
	ENABLE_ROUTE_CLUSTERING: false,
	ENABLE_OFFLINE_MODE: false,
	ENABLE_TRAFFIC_LIGHTS_CHECK: false, // Enabled with heuristic approach
	ENABLE_PARK_ADJACENCY_CHECK: false, // Disabled to avoid Overpass rate limits
} as const;
