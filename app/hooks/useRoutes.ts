"use client";

import { useState, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import type { RouteSummary, Preferences, Coordinate } from "../lib/types";
import { findRoutes } from "../actions";

/**
 * Return type for useRoutes hook.
 */
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

/**
 * Hook for managing route generation and selection.
 *
 * Handles route generation with race condition prevention, debouncing,
 * and provides methods for route management and error handling.
 *
 * @returns Route state and control functions
 */
export function useRoutes(): UseRoutesReturn {
	const [routes, setRoutes] = useState<RouteSummary[]>([]);
	const [activeRoute, setActiveRoute] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
			const requestId = Symbol("route-request");
			currentRequestRef.current = requestId;

			setIsLoading(true);
			setError(null);

			try {
				const result = await findRoutes(start, preferences);

				if (currentRequestRef.current === requestId) {
					setRoutes(result.routes);
					setActiveRoute(result.routes.length > 0 ? 0 : null);
				}
			} catch (err) {
				if (currentRequestRef.current === requestId) {
					const errorMessage =
						err instanceof Error ? err.message : "Failed to generate routes";
					setError(errorMessage);
					setRoutes([]);
					setActiveRoute(null);
				}
			} finally {
				if (currentRequestRef.current === requestId) {
					setIsLoading(false);
				}
			}
		},
		[],
	);

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
