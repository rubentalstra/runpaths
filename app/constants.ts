// Map configuration
export const DEFAULT_MAP_CENTER: [number, number] = [4.8952, 52.3702];
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
export const QUICK_DISTANCES = [3, 5, 10, 15];

// Scoring weights
export const DISTANCE_PENALTY_WEIGHT = 40;
export const LIGHTS_PENALTY_WEIGHT = 25;
export const PARKS_BONUS_WEIGHT = 25;
export const BASELINE_SCORE = 10;

// Route generation
export const SEEDS = [11, 22, 33, 44, 55];
export const MIN_ROUTE_LENGTH = 800;
export const MAX_ROUTES = 3;

// Traffic lights
export const LIGHTS_NEAR_DISTANCE_METERS = 20;
export const MAX_LIGHTS_FOR_PENALTY = 20;

// Parks
export const PARK_NEAR_DISTANCE_METERS = 40;
export const PARK_SAMPLE_COUNT_FACTOR = 25; // samples per 25m

// API timeouts
export const OVERPASS_TIMEOUT_SECONDS = 25;

// Default walking speed for duration estimation (km/h)
export const DEFAULT_WALKING_SPEED_KMH = 5;
