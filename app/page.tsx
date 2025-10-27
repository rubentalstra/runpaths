"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import maplibregl, { Map as MapLibreMap, LngLatLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import clsx from "classnames";
import { findRoutes } from "./actions";

type RouteSummary = {
	id: number;
	geojson: GeoJSON.FeatureCollection;
	dist: number; // meters
	duration: number; // seconds (from ORS if available, else estimate)
	lights: number;
	parkAdjacency: number; // 0..1
	score: number;
	lightsPositions?: [number, number][];
};

export default function Page() {
	const mapId = useId();
	const distanceId = useId();
	const avoidId = useId();
	const preferId = useId();
	const mapRef = useRef<MapLibreMap | null>(null);
	const [start, setStart] = useState<[number, number] | null>(null);
	const [routes, setRoutes] = useState<RouteSummary[]>([]);
	const [activeRoute, setActiveRoute] = useState<number | null>(null);
	const [isPending, startTransition] = useTransition();

	const [kms, setKms] = useState(5);
	const [avoidLights, setAvoidLights] = useState(0.8);
	const [preferParks, setPreferParks] = useState(0.7);

	// Init map with OSM raster tiles (dev-friendly)
	useEffect(() => {
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
			center: [4.8952, 52.3702],
			zoom: 12,
		});
		map.addControl(new maplibregl.NavigationControl({}), "top-right");
		map.on("click", (e) => {
			const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
			setStart(lngLat);
		});
		mapRef.current = map;
		return () => map.remove();
	}, [mapId]);

	// start marker + route layers
	useEffect(() => {
		const map = mapRef.current;
		if (!map || !start) return;
		const el = document.createElement("div");
		el.className = "rounded-full border-4 border-brand-accent bg-white";
		el.style.width = "18px";
		el.style.height = "18px";
		const marker = new maplibregl.Marker({ element: el })
			.setLngLat(start as LngLatLike)
			.addTo(map);
		return () => {
			marker.remove();
		};
	}, [start]);

	// Draw routes whenever selection changes
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
			).coordinates as [number, number][];
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
				{ padding: 80, duration: 600 },
			);
		} catch {}

		// Primary route
		map.addSource("route-main", { type: "geojson", data: primary.geojson });
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
			map.addSource(sid, { type: "geojson", data: r.geojson });
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

		// Traffic lights near route
		if (primary.lightsPositions?.length) {
			map.addSource("lights", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: primary.lightsPositions.map(([lon, lat]) => ({
						type: "Feature",
						properties: {},
						geometry: { type: "Point", coordinates: [lon, lat] },
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

	async function handleFindRoutes() {
		if (!start) {
			alert("Click on the map to set your starting location.");
			return;
		}
		startTransition(async () => {
			try {
				const data = await findRoutes(start, {
					distanceMeters: Math.round(kms * 1000),
					avoidLights,
					preferParks,
				});
				setRoutes(data.routes);
				setActiveRoute(0);
			} catch (e) {
				console.error(e);
				alert((e as Error).message || "Error fetching routes");
			}
		});
	}

	const primary = routes[activeRoute ?? 0];

	return (
		<div className="h-screen w-screen relative">
			<div id={mapId} />

			{/* Top bar */}
			<div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 panel flex items-center gap-3">
				<div className="font-semibold text-brand">RunPaths</div>
				<span className="text-sm text-neutral-500">
					Click the map to set your start, pick distance, then “Find routes”.
				</span>
			</div>

			{/* Side panel */}
			<div className="fixed left-4 top-1/2 -translate-y-1/2 w-[360px] z-20 panel p-4 space-y-4">
				<h2 className="text-lg font-semibold text-brand">Plan your loop</h2>
				<div className="space-y-1">
					<label htmlFor={distanceId} className="text-sm font-medium">
						Target distance: <span className="text-brand-accent">{kms} km</span>
					</label>
					<input
						id={distanceId}
						type="range"
						min={1}
						max={25}
						step={0.5}
						value={kms}
						onChange={(e) => setKms(Number(e.target.value))}
						className="w-full"
					/>
					<div className="flex gap-2">
						{[3, 5, 10, 15].map((k) => (
							<button
								key={k}
								type="button"
								onClick={() => setKms(k)}
								className={clsx(
									"px-3 py-1 rounded-full border text-sm",
									kms === k
										? "bg-brand-accent text-white border-brand-accent"
										: "border-neutral-300 hover:bg-neutral-100",
								)}
							>
								{k}k
							</button>
						))}
					</div>
				</div>
				<div className="space-y-2">
					<div className="flex justify-between">
						<label htmlFor={avoidId} className="text-sm font-medium">
							Avoid traffic lights
						</label>
						<span className="text-sm">{Math.round(avoidLights * 100)}%</span>
					</div>
					<input
						id={avoidId}
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={avoidLights}
						onChange={(e) => setAvoidLights(Number(e.target.value))}
						className="w-full"
					/>
				</div>
				<div className="space-y-2">
					<div className="flex justify-between">
						<label htmlFor={preferId} className="text-sm font-medium">
							Prefer parks
						</label>
						<span className="text-sm">{Math.round(preferParks * 100)}%</span>
					</div>
					<input
						id={preferId}
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={preferParks}
						onChange={(e) => setPreferParks(Number(e.target.value))}
						className="w-full"
					/>
				</div>
				<button
					type="button"
					onClick={handleFindRoutes}
					disabled={isPending}
					className="w-full bg-brand text-white rounded-xl py-3 hover:bg-brand-dark transition disabled:opacity-50"
				>
					{isPending ? "Finding routes..." : "Find routes"}
				</button>{" "}
				<div className="space-y-2">
					<div className="flex justify-between">
						<label className="text-sm font-medium">Avoid traffic lights</label>
						<span className="text-sm">{Math.round(avoidLights * 100)}%</span>
					</div>
					<input
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={avoidLights}
						onChange={(e) => setAvoidLights(Number(e.target.value))}
						className="w-full"
					/>
				</div>
				<div className="space-y-2">
					<div className="flex justify-between">
						<label className="text-sm font-medium">Prefer parks</label>
						<span className="text-sm">{Math.round(preferParks * 100)}%</span>
					</div>
					<input
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={preferParks}
						onChange={(e) => setPreferParks(Number(e.target.value))}
						className="w-full"
					/>
				</div>
				<button
					type="button"
					onClick={handleFindRoutes}
					disabled={isPending}
					className="w-full bg-brand text-white rounded-xl py-3 hover:bg-brand-dark transition disabled:opacity-50"
				>
					{isPending ? "Finding routes..." : "Find routes"}
				</button>
				<div className="text-xs text-neutral-500">
					Tiles © OpenStreetMap contributors. Routing by OpenRouteService. Data
					via Overpass API.
				</div>
			</div>

			{/* Bottom stats */}
			{primary && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 panel px-4 py-3 w-[680px]">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-6">
							<Stat
								label="Distance"
								value={`${(primary.dist / 1000).toFixed(2)} km`}
							/>
							<Stat
								label="Est. time"
								value={`${Math.round(primary.duration / 60)} min`}
							/>
							<Stat label="Traffic lights (near)" value={`${primary.lights}`} />
							<Stat
								label="Near parks"
								value={`${Math.round(primary.parkAdjacency * 100)}%`}
							/>
							<Stat
								label="Score"
								value={`${(primary.score * 100).toFixed(0)}`}
								suffix="/100"
							/>
						</div>
						<div className="flex items-center gap-2">
							{routes.map((r, idx) => (
								<button
									key={r.id}
									type="button"
									onClick={() => setActiveRoute(idx)}
									className={clsx(
										"px-3 py-1 rounded-lg border text-sm",
										routes[activeRoute ?? 0]?.id === r.id
											? "bg-brand-accent text-white border-brand-accent"
											: "border-neutral-300 hover:bg-neutral-100",
									)}
								>
									Route {idx + 1}
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function Stat({
	label,
	value,
	suffix,
}: {
	label: string;
	value: string;
	suffix?: string;
}) {
	return (
		<div>
			<div className="text-xs text-neutral-500">{label}</div>
			<div className="text-base font-semibold">
				{value}
				{suffix ?? ""}
			</div>
		</div>
	);
}
