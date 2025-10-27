"use client";

import { useState, useCallback } from "react";
import type { Preferences } from "../lib/types";
import {
	DEFAULT_DISTANCE_KM,
	DEFAULT_AVOID_LIGHTS,
	DEFAULT_PREFER_PARKS,
	DEFAULT_PACE_MIN_PER_KM,
	MIN_DISTANCE_KM,
	MAX_DISTANCE_KM,
	MIN_PREFERENCE,
	MAX_PREFERENCE,
	MIN_PACE_MIN_PER_KM,
	MAX_PACE_MIN_PER_KM,
} from "../lib/constants";
import { clamp } from "../lib/utils";

interface UsePreferencesReturn {
	preferences: Preferences;
	updateDistance: (km: number) => void;
	updateAvoidTrafficLights: (value: number) => void;
	updatePreferParks: (value: number) => void;
	updatePace: (minPerKm: number) => void;
	resetToDefaults: () => void;
}

export function usePreferences(): UsePreferencesReturn {
	const [preferences, setPreferences] = useState<Preferences>({
		distanceMeters: DEFAULT_DISTANCE_KM * 1000,
		avoidTrafficLights: DEFAULT_AVOID_LIGHTS,
		preferParks: DEFAULT_PREFER_PARKS,
		paceMinPerKm: DEFAULT_PACE_MIN_PER_KM,
	});

	const updateDistance = useCallback((km: number) => {
		const clampedKm = clamp(km, MIN_DISTANCE_KM, MAX_DISTANCE_KM);
		setPreferences((prev) => ({
			...prev,
			distanceMeters: clampedKm * 1000,
		}));
	}, []);

	const updateAvoidTrafficLights = useCallback((value: number) => {
		const clampedValue = clamp(value, MIN_PREFERENCE, MAX_PREFERENCE);
		setPreferences((prev) => ({
			...prev,
			avoidTrafficLights: clampedValue,
		}));
	}, []);

	const updatePreferParks = useCallback((value: number) => {
		const clampedValue = clamp(value, MIN_PREFERENCE, MAX_PREFERENCE);
		setPreferences((prev) => ({
			...prev,
			preferParks: clampedValue,
		}));
	}, []);

	const updatePace = useCallback((minPerKm: number) => {
		const clampedValue = clamp(
			minPerKm,
			MIN_PACE_MIN_PER_KM,
			MAX_PACE_MIN_PER_KM,
		);
		setPreferences((prev) => ({
			...prev,
			paceMinPerKm: clampedValue,
		}));
	}, []);

	const resetToDefaults = useCallback(() => {
		setPreferences({
			distanceMeters: DEFAULT_DISTANCE_KM * 1000,
			avoidTrafficLights: DEFAULT_AVOID_LIGHTS,
			preferParks: DEFAULT_PREFER_PARKS,
			paceMinPerKm: DEFAULT_PACE_MIN_PER_KM,
		});
	}, []);

	return {
		preferences,
		updateDistance,
		updateAvoidTrafficLights,
		updatePreferParks,
		updatePace,
		resetToDefaults,
	};
}
