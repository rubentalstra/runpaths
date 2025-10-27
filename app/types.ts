import type { DirectionsGeoJSONResponse, Coordinate } from "ors-client";

export type RouteSummary = {
	id: number;
	geojson: DirectionsGeoJSONResponse;
	dist: number; // meters
	duration: number; // seconds
	lights: number;
	parkAdjacency: number; // 0..1
	score: number;
	lightsPositions?: Coordinate[];
};

export type Prefs = {
	distanceMeters: number;
	avoidLights: number;
	preferParks: number;
};

export type TrafficLightResult = {
	count: number;
	positions: Coordinate[];
};

export type OverpassElement = {
	type: "node" | "way" | "relation";
	id: number;
	lat?: number;
	lon?: number;
	geometry?: Array<{ lat: number; lon: number }>;
	members?: Array<{
		type: string;
		ref: number;
		role: string;
		geometry?: Array<{ lat: number; lon: number }>;
	}>;
};

export type OverpassResponse = {
	version: number;
	generator: string;
	elements: OverpassElement[];
};
