"use client";

import { useState, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import type { RouteSummary, Preferences, Coordinate } from "../lib/types";
import { findRoutes } from "../actions";

interface UseRoutesReturn {
	routes: RouteSummary[];
	activeRoute: number | null;
	isLoading: boolean;
	error: string | null;
	generateRoutes: (
		start: Coordinate,
		preferences: Preferences,
	) => Promise<void>;
	setActiveRoute: (index: number | null) => void;
	clearRoutes: () => void;
	clearError: () => void;
}

export function useRoutes(): UseRoutesReturn {
	const [routes, setRoutes] = useState<RouteSummary[]>([]);
	const [activeRoute, setActiveRoute] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Track the current request to prevent race conditions
	const currentRequestRef = useRef<symbol | null>(null);

	const clearRoutes = useCallback(() => {
		setRoutes([]);
		setActiveRoute(null);
		setError(null);
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const generateRoutes = useCallback(
		async (start: Coordinate, preferences: Preferences) => {
			// Create a unique request ID to handle race conditions
			const requestId = Symbol("route-request");
			currentRequestRef.current = requestId;

			setIsLoading(true);
			setError(null);

			try {
				const result = await findRoutes(start, preferences);

				// Check if this is still the current request
				if (currentRequestRef.current === requestId) {
					setRoutes(result.routes);
					setActiveRoute(result.routes.length > 0 ? 0 : null);
				}
			} catch (err) {
				// Only set error if this is still the current request
				if (currentRequestRef.current === requestId) {
					const errorMessage =
						err instanceof Error ? err.message : "Failed to generate routes";
					setError(errorMessage);
					setRoutes([]);
					setActiveRoute(null);
				}
			} finally {
				// Only set loading to false if this is still the current request
				if (currentRequestRef.current === requestId) {
					setIsLoading(false);
				}
			}
		},
		[],
	);

	// Debounced version for rapid preference changes
	const [debouncedGenerateRoutes] = useDebounce(generateRoutes, 500);

	const handleSetActiveRoute = useCallback(
		(index: number | null) => {
			if (index === null || (index >= 0 && index < routes.length)) {
				setActiveRoute(index);
			}
		},
		[routes.length],
	);

	return {
		routes,
		activeRoute,
		isLoading,
		error,
		generateRoutes: debouncedGenerateRoutes,
		setActiveRoute: handleSetActiveRoute,
		clearRoutes,
		clearError,
	};
}
