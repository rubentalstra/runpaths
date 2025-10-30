/**
 * Tests for the usePreferences hook.
 */

import { renderHook, act } from "@testing-library/react";
import { usePreferences } from "@/app/hooks/usePreferences";

describe("usePreferences", () => {
	it("should initialize with default preferences", () => {
		const { result } = renderHook(() => usePreferences());

		expect(result.current.preferences.distanceMeters).toBe(5000);
		expect(result.current.preferences.avoidTrafficLights).toBe(0.8);
		expect(result.current.preferences.preferParks).toBe(0.7);
		expect(result.current.preferences.paceMinPerKm).toBe(6);
		expect(result.current.preferences.colorblindMode).toBe(false);
	});

	it("should update distance", () => {
		const { result } = renderHook(() => usePreferences());

		act(() => {
			result.current.updateDistance(10);
		});

		expect(result.current.preferences.distanceMeters).toBe(10000);
	});

	it("should clamp distance to valid range", () => {
		const { result } = renderHook(() => usePreferences());

		act(() => {
			result.current.updateDistance(0);
		});
		expect(result.current.preferences.distanceMeters).toBe(1000);

		act(() => {
			result.current.updateDistance(30);
		});
		expect(result.current.preferences.distanceMeters).toBe(25000);
	});

	it("should update avoid traffic lights", () => {
		const { result } = renderHook(() => usePreferences());

		act(() => {
			result.current.updateAvoidTrafficLights(0.5);
		});

		expect(result.current.preferences.avoidTrafficLights).toBe(0.5);
	});

	it("should update prefer parks", () => {
		const { result } = renderHook(() => usePreferences());

		act(() => {
			result.current.updatePreferParks(0.9);
		});

		expect(result.current.preferences.preferParks).toBe(0.9);
	});

	it("should update pace", () => {
		const { result } = renderHook(() => usePreferences());

		act(() => {
			result.current.updatePace(5);
		});

		expect(result.current.preferences.paceMinPerKm).toBe(5);
	});

	it("should update colorblind mode", () => {
		const { result } = renderHook(() => usePreferences());

		act(() => {
			result.current.updateColorblindMode(true);
		});

		expect(result.current.preferences.colorblindMode).toBe(true);
	});

	it("should reset to defaults", () => {
		const { result } = renderHook(() => usePreferences());

		act(() => {
			result.current.updateDistance(15);
			result.current.updatePace(8);
			result.current.updateColorblindMode(true);
		});

		act(() => {
			result.current.resetToDefaults();
		});

		expect(result.current.preferences.distanceMeters).toBe(5000);
		expect(result.current.preferences.paceMinPerKm).toBe(6);
		expect(result.current.preferences.colorblindMode).toBe(false);
	});
});
