"use client";

import { useId, useState, useTransition, useEffect } from "react";
import { findRoutes } from "./actions";
import type { RouteSummary } from "./types";
import type { Coordinate } from "ors-client";
import { MapComponent } from "../components/Map";
import { Controls } from "../components/Controls";
import { RouteStats } from "../components/RouteStats";
import { CitySearch } from "../components/CitySearch";
import { ToastContainer, useToast } from "../components/Toast";
import {
	DEFAULT_DISTANCE_KM,
	DEFAULT_AVOID_LIGHTS,
	DEFAULT_PREFER_PARKS,
	GEOLOCATION_TIMEOUT_MS,
	GEOLOCATION_MAXIMUM_AGE_MS,
} from "./constants";

type LocationState = "loading" | "success" | "denied" | "error";

export default function Page() {
	const mapId = useId();
	const [start, setStart] = useState<Coordinate | null>(null);
	const [routes, setRoutes] = useState<RouteSummary[]>([]);
	const [activeRoute, setActiveRoute] = useState<number | null>(null);
	const [isPending, startTransition] = useTransition();

	const [kms, setKms] = useState(DEFAULT_DISTANCE_KM);
	const [avoidLights, setAvoidLights] = useState(DEFAULT_AVOID_LIGHTS);
	const [preferParks, setPreferParks] = useState(DEFAULT_PREFER_PARKS);

	const [locationState, setLocationState] = useState<LocationState>("loading");
	const [showCitySearch, setShowCitySearch] = useState(false);
	const [currentCity, setCurrentCity] = useState<string>("");

	const { toasts, addToast, removeToast } = useToast();

	// Try to get user's location on mount
	useEffect(() => {
		if (!navigator.geolocation) {
			setLocationState("error");
			setShowCitySearch(true);
			addToast(
				"Geolocation is not supported by this browser. Please search for your city.",
				"error",
			);
			return;
		}

		addToast("Getting your location...", "info");
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const lngLat: Coordinate = [
					position.coords.longitude,
					position.coords.latitude,
				];
				setStart(lngLat);
				setLocationState("success");
				addToast("Location found! You can now find routes.", "success");
			},
			(error) => {
				console.warn("Geolocation error:", error);
				setLocationState(
					error.code === error.PERMISSION_DENIED ? "denied" : "error",
				);
				setShowCitySearch(true);
				const message =
					error.code === error.PERMISSION_DENIED
						? "Location access denied. Please search for your city or click on the map."
						: "Unable to get your location. Please search for your city or click on the map.";
				addToast(message, "error");
			},
			{
				timeout: GEOLOCATION_TIMEOUT_MS,
				maximumAge: GEOLOCATION_MAXIMUM_AGE_MS,
				enableHighAccuracy: true,
			},
		);
	}, [addToast]);

	async function handleFindRoutes() {
		if (!start) {
			addToast("Please set your starting location first.", "error");
			return;
		}
		startTransition(async () => {
			try {
				addToast("Finding routes...", "info");
				const data = await findRoutes(start, {
					distanceMeters: Math.round(kms * 1000),
					avoidLights,
					preferParks,
				});
				setRoutes(data.routes);
				setActiveRoute(0);
				addToast(
					`Found ${data.routes.length} route${data.routes.length === 1 ? "" : "s"}!`,
					"success",
				);
			} catch (e) {
				console.error(e);
				const message =
					(e as Error).message || "Error fetching routes. Please try again.";
				addToast(message, "error");
			}
		});
	}

	function handleCitySelect(lngLat: Coordinate, cityName: string) {
		setStart(lngLat);
		setCurrentCity(cityName);
		setShowCitySearch(false);
		setLocationState("success");
		addToast(
			`Starting location set to ${cityName}. You can now find routes!`,
			"success",
		);
	}

	function getTopBarMessage() {
		if (locationState === "loading") {
			return "Getting your location...";
		}
		if (locationState === "denied") {
			return "Location access denied. Search for your city or click the map.";
		}
		if (locationState === "error") {
			return "Location unavailable. Search for your city or click the map.";
		}
		if (start && currentCity) {
			return `Starting in ${currentCity}. Click "Find routes" to get running paths.`;
		}
		if (start) {
			return 'Start location set. Click "Find routes" to get running paths.';
		}
		return 'Click the map to set your start location, then "Find routes".';
	}

	return (
		<div className="h-screen w-screen relative">
			<MapComponent
				mapId={mapId}
				start={start}
				routes={routes}
				activeRoute={activeRoute}
				onMapClick={(lngLat) => {
					setStart(lngLat);
					setCurrentCity("");
					addToast(
						"Start location set. Click 'Find routes' to get running paths.",
						"success",
					);
				}}
				initialCenter={start}
			/>

			{/* Top bar */}
			<div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 panel flex items-center gap-3">
				<div className="font-semibold text-brand">RunPaths</div>
				<span className="text-sm text-neutral-500">{getTopBarMessage()}</span>
			</div>

			<CitySearch isVisible={showCitySearch} onCitySelect={handleCitySelect} />

			<Controls
				kms={kms}
				setKms={setKms}
				avoidLights={avoidLights}
				setAvoidLights={setAvoidLights}
				preferParks={preferParks}
				setPreferParks={setPreferParks}
				onFindRoutes={handleFindRoutes}
				isPending={isPending}
			/>

			<RouteStats
				routes={routes}
				activeRoute={activeRoute}
				onSelectRoute={setActiveRoute}
			/>

			<ToastContainer toasts={toasts} removeToast={removeToast} />
		</div>
	);
}
