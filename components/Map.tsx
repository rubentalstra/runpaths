"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteSummary, Coordinate } from "@/app/lib/types";
import {
	DEFAULT_MAP_CENTER,
	DEFAULT_MAP_ZOOM,
	MAP_PADDING,
	MAP_ANIMATION_DURATION,
	FEATURES,
	ROUTE_COLORS,
} from "@/app/lib/constants";

/**
 * Props for the MapComponent.
 */
interface MapProps {
	readonly mapId: string;
	readonly start: Coordinate | null;
	readonly routes: readonly RouteSummary[];
	readonly activeRoute: number | null;
	readonly onMapClick: (lngLat: Coordinate) => void;
	readonly initialCenter?: Coordinate | null;
	readonly isManualLocation?: boolean;
	readonly colorblindMode?: boolean;
}

/**
 * Interactive map component using MapLibre GL.
 *
 * Displays running routes, start location markers, and traffic lights.
 * Supports colorblind-friendly mode and automatic route fitting.
 *
 * @param props - Component properties
 */
export function MapComponent({
	mapId,
	start,
	routes,
	activeRoute,
	onMapClick,
	initialCenter,
	isManualLocation = false,
	colorblindMode = false,
}: MapProps) {
	const mapRef = useRef<MapLibreMap | null>(null);

	const colors = colorblindMode
		? ROUTE_COLORS.colorblind
		: ROUTE_COLORS.default;

	useEffect(() => {
		const center = initialCenter || DEFAULT_MAP_CENTER;
		const map = new maplibregl.Map({
			container: mapId,
			style: {
				version: 8,
				sources: {
					osm: {
						type: "raster",
						tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
						tileSize: 256,
						attribution:
							'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
					},
				},
				layers: [{ id: "osm", type: "raster", source: "osm" }],
			},
			center,
			zoom: DEFAULT_MAP_ZOOM,
		});
		map.addControl(new maplibregl.NavigationControl({}), "top-right");

		map.getCanvas().style.cursor = "crosshair";

		map.on("click", (e) => {
			const lngLat: Coordinate = [e.lngLat.lng, e.lngLat.lat];
			onMapClick(lngLat);
		});
		mapRef.current = map;
		return () => map.remove();
	}, [mapId, onMapClick, initialCenter]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map || !start) return;

		const el = document.createElement("div");

		if (isManualLocation) {
			el.innerHTML = `
				<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20c0-6.6-5.4-12-12-12z" fill="#3B82F6"/>
					<circle cx="12" cy="12" r="5" fill="white"/>
				</svg>
			`;
			el.style.cursor = "pointer";
			el.title = "Manual start location (click map to change)";
		} else {
			el.className = "rounded-full border-4 border-brand-accent bg-white";
			el.style.width = "18px";
			el.style.height = "18px";
			el.title = "Your current location";
		}

		const marker = new maplibregl.Marker({
			element: el,
			anchor: isManualLocation ? "bottom" : "center",
		})
			.setLngLat(start)
			.addTo(map);

		return () => {
			marker.remove();
		};
	}, [start, isManualLocation]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		const ids = [
			"route-main",
			"route-alt-1",
			"route-alt-2",
			"lights",
			"lights-background",
		];
		ids.forEach((id) => {
			if (map.getLayer(id)) map.removeLayer(id);
			if (map.getSource(id)) map.removeSource(id);
		});
		if (!routes.length) return;

		const primary = routes[activeRoute ?? 0] ?? routes[0];
		try {
			const coords = (
				primary.geojson.features[0].geometry as GeoJSON.LineString
			).coordinates as Coordinate[];
			const lons = coords.map((c) => c[0]);
			const lats = coords.map((c) => c[1]);
			const minX = Math.min(...lons),
				maxX = Math.max(...lons);
			const minY = Math.min(...lats),
				maxY = Math.max(...lats);
			map.fitBounds(
				[
					[minX, minY],
					[maxX, maxY],
				],
				{ padding: MAP_PADDING, duration: MAP_ANIMATION_DURATION },
			);
		} catch {}

		map.addSource("route-main", {
			type: "geojson",
			data: primary.geojson as GeoJSON.FeatureCollection,
		});
		map.addLayer({
			id: "route-main",
			type: "line",
			source: "route-main",
			paint: {
				"line-color": colors.primary,
				"line-width": 6,
				"line-opacity": 0.95,
			},
		});

		const alts = routes.filter((r) => r.id !== primary.id).slice(0, 2);
		alts.forEach((r, i) => {
			const sid = `route-alt-${i + 1}`;
			map.addSource(sid, {
				type: "geojson",
				data: r.geojson as GeoJSON.FeatureCollection,
			});
			map.addLayer({
				id: sid,
				type: "line",
				source: sid,
				paint: {
					"line-color": colors.alternative,
					"line-width": 3,
					"line-opacity": 0.35,
				},
			});
		});

		if (
			FEATURES.ENABLE_TRAFFIC_LIGHTS_CHECK &&
			primary.trafficLights.positions.length > 0
		) {
			map.addSource("lights", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: primary.trafficLights.positions.map((coord) => ({
						type: "Feature" as const,
						properties: {},
						geometry: { type: "Point" as const, coordinates: coord },
					})),
				} as GeoJSON.FeatureCollection,
			});

			map.addLayer({
				id: "lights-background",
				type: "circle",
				source: "lights",
				paint: {
					"circle-radius": 8,
					"circle-color": colors.trafficLightBg,
					"circle-opacity": 0.6,
				},
			});

			map.addLayer({
				id: "lights",
				type: "circle",
				source: "lights",
				paint: {
					"circle-radius": 5,
					"circle-color": colors.trafficLight,
					"circle-stroke-color": "#ffffff",
					"circle-stroke-width": 2,
				},
			});
		}
	}, [routes, activeRoute, colors]);

	return <div id={mapId} className="h-full w-full" />;
}
