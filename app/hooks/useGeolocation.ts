"use client";

import { useState, useEffect, useCallback } from "react";
import type {
	LocationState,
	GeolocationResult,
	CustomGeolocationError,
	GeolocationOptions,
} from "../lib/types";
import {
	GEOLOCATION_TIMEOUT_MS,
	GEOLOCATION_MAXIMUM_AGE_MS,
} from "../lib/constants";
import { isBrowser } from "../lib/utils";

interface UseGeolocationReturn {
	location: GeolocationResult | null;
	error: CustomGeolocationError | null;
	state: LocationState;
	requestLocation: () => void;
	clearError: () => void;
	isSupported: boolean;
}

export function useGeolocation(
	options: GeolocationOptions = {},
): UseGeolocationReturn {
	const [location, setLocation] = useState<GeolocationResult | null>(null);
	const [error, setError] = useState<CustomGeolocationError | null>(null);
	const [state, setState] = useState<LocationState>("idle");

	const isSupported = isBrowser() && "geolocation" in navigator;

	const clearError = useCallback(() => {
		setError(null);
		if (state === "error" || state === "denied" || state === "timeout") {
			setState("idle");
		}
	}, [state]);

	const requestLocation = useCallback(() => {
		if (!isSupported) {
			const errorObj: CustomGeolocationError = {
				code: 2, // POSITION_UNAVAILABLE
				message: "Geolocation is not supported by this browser",
				timestamp: Date.now(),
			};
			setError(errorObj);
			setState("error");
			return;
		}

		setState("loading");
		setError(null);

		const geolocationOptions: PositionOptions = {
			timeout: options.timeout ?? GEOLOCATION_TIMEOUT_MS,
			maximumAge: options.maximumAge ?? GEOLOCATION_MAXIMUM_AGE_MS,
			enableHighAccuracy: options.enableHighAccuracy ?? true,
		};

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const result: GeolocationResult = {
					coordinate: [position.coords.longitude, position.coords.latitude],
					accuracy: position.coords.accuracy,
					timestamp: position.timestamp,
				};
				setLocation(result);
				setState("success");
			},
			(positionError) => {
				let errorState: LocationState;
				let message: string;

				switch (positionError.code) {
					case positionError.PERMISSION_DENIED:
						errorState = "denied";
						message =
							"Location access was denied. Please enable location services.";
						break;
					case positionError.POSITION_UNAVAILABLE:
						errorState = "error";
						message = "Location information is unavailable.";
						break;
					case positionError.TIMEOUT:
						errorState = "timeout";
						message = "Location request timed out. Please try again.";
						break;
					default:
						errorState = "error";
						message = "An unknown error occurred while retrieving location.";
				}

				const errorObj: CustomGeolocationError = {
					code: positionError.code,
					message,
					timestamp: Date.now(),
				};

				setError(errorObj);
				setState(errorState);
			},
			geolocationOptions,
		);
	}, [isSupported, options]);

	// Auto-request location on mount if supported
	useEffect(() => {
		if (isSupported && state === "idle") {
			requestLocation();
		}
	}, [isSupported, requestLocation, state]);

	return {
		location,
		error,
		state,
		requestLocation,
		clearError,
		isSupported,
	};
}
