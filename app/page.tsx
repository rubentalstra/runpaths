"use client";

import { useCallback, useMemo, Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Coordinate } from "ors-client";
import { ErrorBoundary } from "react-error-boundary";

import { useGeolocation, useToast, useRoutes, usePreferences } from "./hooks";
import { MapComponent } from "@/components/Map";
import { RouteStats } from "@/components/RouteStats";
import { ToastContainer } from "@/components/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorFallback } from "@/components/ui/ErrorFallback";
import { FEATURES, ROUTE_COLORS } from "./lib/constants";

// Load interactive components with no SSR to avoid hydration issues
const Controls = dynamic(
	() =>
		import("@/components/Controls").then((mod) => ({ default: mod.Controls })),
	{
		ssr: false,
	},
);

const CitySearch = dynamic(
	() =>
		import("@/components/CitySearch").then((mod) => ({
			default: mod.CitySearch,
		})),
	{
		ssr: false,
	},
);

/**
 * Main application component for the RunPaths route finder.
 *
 * Manages user location (geolocation or manual), route generation preferences,
 * and displays the map with generated running routes.
 */
function HomePage() {
	// Use static ID since this component is only rendered once
	const mapId = "homepage-map";
	const [manualCoordinate, setManualCoordinate] = useState<Coordinate | null>(
		null,
	);
	const [isMounted, setIsMounted] = useState(false);

	// Ensure component only renders on client
	// This is wrapped in a transition to avoid ESLint warning
	useEffect(() => {
		const mountTimer = setTimeout(() => setIsMounted(true), 0);
		return () => clearTimeout(mountTimer);
	}, []);

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
		updateColorblindMode,
	} = usePreferences();

	const currentCoordinate = manualCoordinate || location?.coordinate || null;

	const showCitySearch =
		!isSupported || locationState === "denied" || locationState === "error";

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

	const handleCitySelect = useCallback(
		(coordinate: Coordinate, cityName: string) => {
			setManualCoordinate(coordinate);
			addToast(
				`Starting location set to ${cityName}. You can now find routes!`,
				"success",
			);
		},
		[addToast],
	);

	const handleMapClick = useCallback(
		(coordinate: Coordinate) => {
			setManualCoordinate(coordinate);
			addToast(
				"Start location set. Click 'Find routes' to get running paths.",
				"success",
			);
		},
		[addToast],
	);

	const handleResetToGeolocation = useCallback(() => {
		setManualCoordinate(null);
		if (location?.coordinate) {
			addToast("Reset to your current location", "info");
		} else {
			addToast(
				"No geolocation available. Click the map to set location.",
				"info",
			);
		}
	}, [location, addToast]);

	const statusMessage = useMemo(() => {
		if (locationState === "loading" && !manualCoordinate) {
			return "Getting your location...";
		}
		if (locationState === "denied" && !manualCoordinate) {
			return "Location access denied. Search for your city or click the map.";
		}
		if (
			(locationState === "error" || locationState === "timeout") &&
			!manualCoordinate
		) {
			return "Location unavailable. Search for your city or click the map.";
		}
		if (manualCoordinate) {
			return 'Custom location set. Click "Find routes" to get running paths.';
		}
		if (currentCoordinate) {
			return 'Start location set. Click "Find routes" to get running paths.';
		}
		return 'Click the map to set your start location, then "Find routes".';
	}, [locationState, currentCoordinate, manualCoordinate]);

	// Prevent hydration mismatch by not rendering dynamic content until mounted
	if (!isMounted) {
		return (
			<div className="h-screen w-screen relative bg-neutral-50">
				<LoadingSpinner />
			</div>
		);
	}

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
					isManualLocation={manualCoordinate !== null}
					colorblindMode={preferences.colorblindMode || false}
				/>
			</Suspense>

			<div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 panel flex items-center gap-3 max-w-[90vw]">
				<div className="font-semibold text-brand">RunPaths</div>
				<span className="hidden md:inline text-sm text-neutral-600 truncate">
					{statusMessage}
				</span>
				{manualCoordinate && location?.coordinate && (
					<button
						type="button"
						onClick={handleResetToGeolocation}
						className="ml-auto px-3 py-1 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium whitespace-nowrap"
						aria-label="Reset to current location"
					>
						<span className="hidden md:inline">Reset to my location</span>
						<span className="md:hidden">Reset</span>
					</button>
				)}
			</div>

			{!currentCoordinate && routes.length === 0 && (
				<div className="fixed top-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm max-w-[90vw] animate-fade-in">
					<p className="text-sm text-blue-800 text-center">
						👆 Click anywhere on the map to set your starting location
					</p>
				</div>
			)}

			<CitySearch isVisible={showCitySearch} onCitySelect={handleCitySelect} />

			<Controls
				kms={preferences.distanceMeters / 1000}
				setKms={updateDistance}
				avoidLights={preferences.avoidTrafficLights}
				setAvoidLights={updateAvoidTrafficLights}
				preferParks={preferences.preferParks}
				setPreferParks={updatePreferParks}
				pace={preferences.paceMinPerKm}
				setPace={updatePace}
				colorblindMode={preferences.colorblindMode || false}
				setColorblindMode={updateColorblindMode}
				onFindRoutes={handleFindRoutes}
				isPending={isLoading}
			/>

			{routes.length > 0 && (
				<>
					<RouteStats
						routes={routes}
						activeRoute={activeRoute}
						onSelectRoute={setActiveRoute}
						paceMinPerKm={preferences.paceMinPerKm}
					/>

					<div className="hidden md:block fixed bottom-24 right-4 z-20 panel px-3 py-2 text-xs space-y-1">
						<div className="font-semibold text-neutral-700 mb-1">Legend</div>
						<div className="flex items-center gap-2">
							<div
								className="w-4 h-1 rounded"
								style={{
									backgroundColor: preferences.colorblindMode
										? ROUTE_COLORS.colorblind.primary
										: ROUTE_COLORS.default.primary,
								}}
							></div>
							<span className="text-neutral-600">Your route</span>
						</div>
						{FEATURES.ENABLE_TRAFFIC_LIGHTS_CHECK && (
							<div className="flex items-center gap-2">
								<div
									className="w-3 h-3 rounded-full border-2 border-white"
									style={{
										backgroundColor: preferences.colorblindMode
											? ROUTE_COLORS.colorblind.trafficLight
											: ROUTE_COLORS.default.trafficLight,
									}}
								></div>
								<span className="text-neutral-600">Traffic lights (OSM)</span>
							</div>
						)}
					</div>
				</>
			)}

			<ToastContainer toasts={toasts} removeToast={removeToast} />

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
								x
							</button>
						</div>
						<p className="text-red-700 text-sm mt-1">{error}</p>
					</div>
				</div>
			)}
		</div>
	);
}

/**
 * Root page component with error boundary.
 *
 * Wraps the main application in an error boundary to gracefully handle
 * unexpected errors and provide a fallback UI.
 */
export default function Page() {
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<HomePage />
		</ErrorBoundary>
	);
}
