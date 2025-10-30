/**
 * Type definitions for the RunPaths application.
 *
 * @module types
 */

import type { DirectionsGeoJSONResponse, Coordinate } from "ors-client";
import { z } from "zod";

export type { Coordinate } from "ors-client";

export const CoordinateSchema = z.tuple([z.number(), z.number()]);

/**
 * Bounding box represented as [minX, minY, maxX, maxY].
 */
export type BoundingBox = [number, number, number, number];

/**
 * Summary information for a generated route.
 */
export interface RouteSummary {
	readonly id: number;
	readonly geojson: DirectionsGeoJSONResponse;
	readonly distance: number; // meters
	readonly duration: number; // seconds
	readonly trafficLights: TrafficLightInfo;
	readonly parkAdjacency: number; // 0..1
	readonly score: number; // 0..1
	readonly metadata: RouteMetadata;
}

/**
 * Information about traffic lights along a route.
 */
export interface TrafficLightInfo {
	readonly count: number;
	readonly positions: readonly Coordinate[];
}

/**
 * Metadata for a generated route.
 */
export interface RouteMetadata {
	readonly seedUsed: number;
	readonly generatedAt: Date;
	readonly apiVersion: string;
}

/**
 * Zod schema for validating user preferences.
 */
export const PreferencesSchema = z.object({
	distanceMeters: z.number().min(800).max(50000),
	avoidTrafficLights: z.number().min(0).max(1),
	preferParks: z.number().min(0).max(1),
	paceMinPerKm: z.number().min(3).max(10),
	colorblindMode: z.boolean().optional(),
});

/**
 * User preferences for route generation.
 */
export type Preferences = z.infer<typeof PreferencesSchema>;

/**
 * Color scheme type for accessibility.
 */
export type ColorScheme = "default" | "colorblind";

/**
 * Extended preferences with additional route generation options.
 */
export interface RouteGenerationOptions extends Preferences {
	readonly maxRoutes?: number;
	readonly timeoutMs?: number;
	readonly retryAttempts?: number;
}

/**
 * State of the geolocation request.
 */
export type LocationState =
	| "idle"
	| "loading"
	| "success"
	| "denied"
	| "error"
	| "timeout";

/**
 * Result from a successful geolocation request.
 */
export interface GeolocationResult {
	readonly coordinate: Coordinate;
	readonly accuracy: number;
	readonly timestamp: number;
}

/**
 * Custom error object for geolocation failures.
 */
export interface CustomGeolocationError {
	readonly code: GeolocationPositionError["code"];
	readonly message: string;
	readonly timestamp: number;
}

/**
 * Options for geolocation requests.
 */
export interface GeolocationOptions {
	readonly timeout?: number;
	readonly maximumAge?: number;
	readonly enableHighAccuracy?: boolean;
}

/**
 * Generic API response wrapper.
 */
export interface ApiResponse<T> {
	readonly success: boolean;
	readonly data?: T;
	readonly error?: string;
	readonly timestamp: number;
}

/**
 * Response from route generation API.
 */
export interface RouteGenerationResponse {
	readonly routes: RouteSummary[];
	readonly metadata: {
		readonly requestId: string;
		readonly processingTimeMs: number;
		readonly apiCalls: number;
	};
}

/**
 * Element from Overpass API response.
 */
export interface OverpassElement {
	readonly type: "node" | "way" | "relation";
	readonly id: number;
	readonly lat?: number;
	readonly lon?: number;
	readonly geometry?: ReadonlyArray<{
		readonly lat: number;
		readonly lon: number;
	}>;
	readonly members?: ReadonlyArray<{
		readonly type: string;
		readonly ref: number;
		readonly role: string;
		readonly geometry?: ReadonlyArray<{
			readonly lat: number;
			readonly lon: number;
		}>;
	}>;
	readonly tags?: Record<string, string>;
}

/**
 * Response from Overpass API.
 */
export interface OverpassResponse {
	readonly version: number;
	readonly generator: string;
	readonly elements: ReadonlyArray<OverpassElement>;
}

/**
 * Result from Nominatim geocoding API.
 */
export interface NominatimResult {
	readonly place_id: number;
	readonly licence: string;
	readonly osm_type: string;
	readonly osm_id: number;
	readonly lat: string;
	readonly lon: string;
	readonly display_name: string;
	readonly address: {
		readonly city?: string;
		readonly town?: string;
		readonly village?: string;
		readonly country?: string;
		readonly [key: string]: string | undefined;
	};
	readonly boundingbox: readonly string[];
}

/**
 * Type of toast notification.
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Toast notification object.
 */
export interface Toast {
	readonly id: string;
	readonly message: string;
	readonly type: ToastType;
	readonly duration?: number;
	readonly timestamp: number;
}

/**
 * State of the map view.
 */
export interface MapViewState {
	readonly center: Coordinate;
	readonly zoom: number;
	readonly bearing?: number;
	readonly pitch?: number;
}

/**
 * State of map interactions.
 */
export interface MapInteractionState {
	readonly isDragging: boolean;
	readonly isRotating: boolean;
	readonly isZooming: boolean;
}

/**
 * Error thrown during route generation.
 */
export class RouteGenerationError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "RouteGenerationError";
	}
}

/**
 * Error thrown during geolocation requests.
 */
export class GeolocationErrorClass extends Error {
	constructor(
		message: string,
		public readonly code: GeolocationPositionError["code"],
		public readonly originalError?: GeolocationPositionError,
	) {
		super(message);
		this.name = "GeolocationError";
	}
}

/**
 * Error thrown during API requests.
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

/**
 * Makes specified keys optional in a type.
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified keys required in a type.
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Makes all properties in an object deeply readonly.
 */
export type DeepReadonly<T> = {
	readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Global application state interface.
 */
export interface AppState {
	readonly location: {
		readonly state: LocationState;
		readonly coordinate: Coordinate | null;
		readonly cityName: string;
		readonly error: CustomGeolocationError | null;
	};
	readonly routes: {
		readonly isLoading: boolean;
		readonly data: RouteSummary[];
		readonly activeIndex: number | null;
		readonly error: string | null;
	};
	readonly preferences: Preferences;
	readonly ui: {
		readonly showCitySearch: boolean;
		readonly toasts: Toast[];
		readonly mapViewState: MapViewState;
	};
}

/**
 * Action types for state management.
 */
export type AppAction =
	| { type: "SET_LOCATION_STATE"; payload: LocationState }
	| {
			type: "SET_COORDINATE";
			payload: { coordinate: Coordinate; cityName?: string };
	  }
	| { type: "SET_LOCATION_ERROR"; payload: CustomGeolocationError }
	| { type: "SET_ROUTES_LOADING"; payload: boolean }
	| { type: "SET_ROUTES_DATA"; payload: RouteSummary[] }
	| { type: "SET_ACTIVE_ROUTE"; payload: number | null }
	| { type: "SET_ROUTES_ERROR"; payload: string | null }
	| { type: "UPDATE_PREFERENCES"; payload: Partial<Preferences> }
	| { type: "TOGGLE_CITY_SEARCH"; payload?: boolean }
	| { type: "ADD_TOAST"; payload: Omit<Toast, "id" | "timestamp"> }
	| { type: "REMOVE_TOAST"; payload: string }
	| { type: "UPDATE_MAP_VIEW"; payload: Partial<MapViewState> };
