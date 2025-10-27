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
} from "@/app/lib/constants";

interface MapProps {
	readonly mapId: string;
	readonly start: Coordinate | null;
	readonly routes: readonly RouteSummary[];
	readonly activeRoute: number | null;
	readonly onMapClick: (lngLat: Coordinate) => void;
	readonly initialCenter?: Coordinate | null;
}

export function MapComponent({
	mapId,
	start,
	routes,
	activeRoute,
	onMapClick,
	initialCenter,
}: MapProps) {
	const mapRef = useRef<MapLibreMap | null>(null);

	// Init map
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
		map.on("click", (e) => {
			const lngLat: Coordinate = [e.lngLat.lng, e.lngLat.lat];
			onMapClick(lngLat);
		});
		mapRef.current = map;
		return () => map.remove();
	}, [mapId, onMapClick, initialCenter]);

	// start marker
	useEffect(() => {
		const map = mapRef.current;
		if (!map || !start) return;
		const el = document.createElement("div");
		el.className = "rounded-full border-4 border-brand-accent bg-white";
		el.style.width = "18px";
		el.style.height = "18px";
		const marker = new maplibregl.Marker({ element: el })
			.setLngLat(start)
			.addTo(map);
		return () => {
			marker.remove();
		};
	}, [start]);

	// Draw routes
	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		// Remove previous sources/layers
		const ids = ["route-main", "route-alt-1", "route-alt-2", "lights"];
		ids.forEach((id) => {
			if (map.getLayer(id)) map.removeLayer(id);
			if (map.getSource(id)) map.removeSource(id);
		});
		if (!routes.length) return;

		const primary = routes[activeRoute ?? 0] ?? routes[0];
		// Fit bounds
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

		// Primary route
		map.addSource("route-main", {
			type: "geojson",
			data: primary.geojson as GeoJSON.FeatureCollection,
		});
		map.addLayer({
			id: "route-main",
			type: "line",
			source: "route-main",
			paint: {
				"line-color": "#DAA442",
				"line-width": 6,
				"line-opacity": 0.95,
			},
		});

		// Alternatives
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
					"line-color": "#1D282D",
					"line-width": 3,
					"line-opacity": 0.35,
				},
			});
		});

		// Traffic lights near route - only render if feature is enabled
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
				id: "lights",
				type: "circle",
				source: "lights",
				paint: {
					"circle-radius": 4,
					"circle-color": "#E11D48",
					"circle-stroke-color": "#ffffff",
					"circle-stroke-width": 1,
				},
			});
		}
	}, [routes, activeRoute]);

	return <div id={mapId} className="h-full w-full" />;
}
