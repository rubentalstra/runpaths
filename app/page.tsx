"use client";

import {
	useId,
	useCallback,
	useMemo,
	Suspense,
	useState,
	useEffect,
} from "react";
import type { Coordinate } from "ors-client";
import { ErrorBoundary } from "react-error-boundary";

import { useGeolocation, useToast, useRoutes, usePreferences } from "./hooks";
import { MapComponent } from "@/components/Map";
import { Controls } from "@/components/Controls";
import { RouteStats } from "@/components/RouteStats";
import { CitySearch } from "@/components/CitySearch";
import { ToastContainer } from "@/components/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorFallback } from "@/components/ui/ErrorFallback";

function HomePage() {
	const mapId = useId();
	const [isMounted, setIsMounted] = useState(false);

	// Custom hooks for state management
	const { location, state: locationState, isSupported } = useGeolocation();
	const { toasts, addToast, removeToast } = useToast();
	const {
		routes,
		activeRoute,
		isLoading,
		error,
		generateRoutes,
		setActiveRoute,
		clearError,
	} = useRoutes();
	const {
		preferences,
		updateDistance,
		updateAvoidTrafficLights,
		updatePreferParks,
		updatePace,
	} = usePreferences();

	// Ensure component is mounted (client-side only)
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Current coordinate from geolocation or manual selection
	const currentCoordinate = location?.coordinate || null;

	// Show city search when geolocation fails or is denied (only after mount)
	const showCitySearch =
		isMounted &&
		(!isSupported || locationState === "denied" || locationState === "error");

	// Handle route generation
	const handleFindRoutes = useCallback(async () => {
		if (!currentCoordinate) {
			addToast("Please set your starting location first.", "error");
			return;
		}

		clearError();
		addToast("Finding routes...", "info");

		try {
			await generateRoutes(currentCoordinate, preferences);
			if (routes.length > 0) {
				addToast(
					`Found ${routes.length} route${routes.length === 1 ? "" : "s"}!`,
					"success",
				);
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to generate routes";
			addToast(message, "error");
		}
	}, [
		currentCoordinate,
		preferences,
		generateRoutes,
		addToast,
		clearError,
		routes.length,
	]);

	// Handle city selection from search
	const handleCitySelect = useCallback(
		(_coordinate: Coordinate, cityName: string) => {
			addToast(
				`Starting location set to ${cityName}. You can now find routes!`,
				"success",
			);
		},
		[addToast],
	);

	// Handle map click for manual coordinate selection
	const handleMapClick = useCallback(
		(_coordinate: Coordinate) => {
			addToast(
				"Start location set. Click 'Find routes' to get running paths.",
				"success",
			);
		},
		[addToast],
	);

	// Get status message for top bar
	const statusMessage = useMemo(() => {
		if (locationState === "loading") {
			return "Getting your location...";
		}
		if (locationState === "denied") {
			return "Location access denied. Search for your city or click the map.";
		}
		if (locationState === "error" || locationState === "timeout") {
			return "Location unavailable. Search for your city or click the map.";
		}
		if (currentCoordinate) {
			return 'Start location set. Click "Find routes" to get running paths.';
		}
		return 'Click the map to set your start location, then "Find routes".';
	}, [locationState, currentCoordinate]);

	return (
		<div className="h-screen w-screen relative bg-neutral-50">
			<Suspense fallback={<LoadingSpinner />}>
				<MapComponent
					mapId={mapId}
					start={currentCoordinate}
					routes={routes}
					activeRoute={activeRoute}
					onMapClick={handleMapClick}
					initialCenter={currentCoordinate}
				/>
			</Suspense>

			{/* Top status bar */}
			<div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 panel flex items-center gap-3 max-w-[90vw]">
				<div className="font-semibold text-brand">RunPaths</div>
				<span className="text-sm text-neutral-600 truncate">
					{statusMessage}
				</span>
			</div>

			{/* City search modal */}
			<CitySearch isVisible={showCitySearch} onCitySelect={handleCitySelect} />

			{/* Controls panel */}
			<Controls
				kms={preferences.distanceMeters / 1000}
				setKms={updateDistance}
				avoidLights={preferences.avoidTrafficLights}
				setAvoidLights={updateAvoidTrafficLights}
				preferParks={preferences.preferParks}
				setPreferParks={updatePreferParks}
				pace={preferences.paceMinPerKm}
				setPace={updatePace}
				onFindRoutes={handleFindRoutes}
				isPending={isLoading}
			/>

			{/* Route statistics */}
			{routes.length > 0 && (
				<RouteStats
					routes={routes}
					activeRoute={activeRoute}
					onSelectRoute={setActiveRoute}
					paceMinPerKm={preferences.paceMinPerKm}
				/>
			)}

			{/* Toast notifications */}
			<ToastContainer toasts={toasts} removeToast={removeToast} />

			{/* Route generation error display */}
			{error && (
				<div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 max-w-md">
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-slide-up">
						<div className="flex items-center gap-2">
							<div className="text-red-600 font-medium">
								Route Generation Failed
							</div>
							<button
								type="button"
								onClick={clearError}
								className="ml-auto text-red-400 hover:text-red-600 text-xl leading-none"
								aria-label="Dismiss error"
							>
								×
							</button>
						</div>
						<p className="text-red-700 text-sm mt-1">{error}</p>
					</div>
				</div>
			)}
		</div>
	);
}

export default function Page() {
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<HomePage />
		</ErrorBoundary>
	);
}
