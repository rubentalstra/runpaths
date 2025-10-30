/**
 * Tests for the useGeolocation hook.
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useGeolocation } from "@/app/hooks/useGeolocation";

// Mock the browser geolocation API
const mockGeolocation = {
	getCurrentPosition: jest.fn(),
	watchPosition: jest.fn(),
	clearWatch: jest.fn(),
};

describe("useGeolocation", () => {
	beforeEach(() => {
		// Setup geolocation mock
		Object.defineProperty(global.navigator, "geolocation", {
			writable: true,
			value: mockGeolocation,
			configurable: true,
		});
		mockGeolocation.getCurrentPosition.mockClear();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should initialize with idle state", () => {
		const { result } = renderHook(() => useGeolocation());

		expect(result.current.location).toBeNull();
		expect(result.current.error).toBeNull();
		expect(result.current.isSupported).toBe(true);
	});

	it("should request location on mount", async () => {
		mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
			success({
				coords: {
					latitude: 52.3676,
					longitude: 4.9041,
					accuracy: 10,
				},
				timestamp: Date.now(),
			});
		});

		const { result } = renderHook(() => useGeolocation());

		await waitFor(() => {
			expect(result.current.state).toBe("success");
		});

		expect(result.current.location).toEqual({
			coordinate: [4.9041, 52.3676],
			accuracy: 10,
			timestamp: expect.any(Number),
		});
	});

	it("should handle permission denied error", async () => {
		mockGeolocation.getCurrentPosition.mockImplementationOnce(
			(_success, error) => {
				error({
					code: 1, // PERMISSION_DENIED
					message: "User denied geolocation",
					PERMISSION_DENIED: 1,
					POSITION_UNAVAILABLE: 2,
					TIMEOUT: 3,
				});
			},
		);

		const { result } = renderHook(() => useGeolocation());

		await waitFor(() => {
			expect(result.current.state).toBe("denied");
		});

		expect(result.current.error).toEqual({
			code: 1,
			message: "Location access was denied. Please enable location services.",
			timestamp: expect.any(Number),
		});
	});

	it("should handle position unavailable error", async () => {
		mockGeolocation.getCurrentPosition.mockImplementationOnce(
			(_success, error) => {
				error({
					code: 2, // POSITION_UNAVAILABLE
					message: "Position unavailable",
					PERMISSION_DENIED: 1,
					POSITION_UNAVAILABLE: 2,
					TIMEOUT: 3,
				});
			},
		);

		const { result } = renderHook(() => useGeolocation());

		await waitFor(() => {
			expect(result.current.state).toBe("error");
		});

		expect(result.current.error?.message).toBe(
			"Location information is unavailable.",
		);
	});

	it("should handle timeout error", async () => {
		mockGeolocation.getCurrentPosition.mockImplementationOnce(
			(_success, error) => {
				error({
					code: 3, // TIMEOUT
					message: "Timeout",
					PERMISSION_DENIED: 1,
					POSITION_UNAVAILABLE: 2,
					TIMEOUT: 3,
				});
			},
		);

		const { result } = renderHook(() => useGeolocation());

		await waitFor(() => {
			expect(result.current.state).toBe("timeout");
		});

		expect(result.current.error?.message).toBe(
			"Location request timed out. Please try again.",
		);
	});

	it("should manually request location", async () => {
		mockGeolocation.getCurrentPosition.mockImplementation((success) => {
			success({
				coords: {
					latitude: 51.5074,
					longitude: -0.1278,
					accuracy: 15,
				},
				timestamp: Date.now(),
			});
		});

		const { result } = renderHook(() => useGeolocation());

		await waitFor(() => {
			expect(result.current.state).toBe("success");
		});

		act(() => {
			result.current.requestLocation();
		});

		expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
	});

	it("should clear error", async () => {
		let callCount = 0;
		mockGeolocation.getCurrentPosition.mockImplementation(
			(success, error) => {
				if (callCount === 0) {
					callCount++;
					error({
						code: 1,
						message: "Denied",
						PERMISSION_DENIED: 1,
						POSITION_UNAVAILABLE: 2,
						TIMEOUT: 3,
					});
				} else {
					// Second call after clearError should succeed
					success({
						coords: {
							latitude: 52.3676,
							longitude: 4.9041,
							accuracy: 10,
						},
						timestamp: Date.now(),
					});
				}
			},
		);

		const { result } = renderHook(() => useGeolocation());

		await waitFor(() => {
			expect(result.current.error).not.toBeNull();
			expect(result.current.state).toBe("denied");
		});

		act(() => {
			result.current.clearError();
		});

		expect(result.current.error).toBeNull();
		
		// The hook automatically requests location again after clearing error (state goes from "denied" -> "idle" -> "loading" -> "success")
		await waitFor(() => {
			expect(result.current.state).toBe("success");
		});
	});

	it("should handle custom options", async () => {
		mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
			success({
				coords: {
					latitude: 52.3676,
					longitude: 4.9041,
					accuracy: 10,
				},
				timestamp: Date.now(),
			});
		});

		const options = {
			timeout: 5000,
			maximumAge: 30000,
			enableHighAccuracy: false,
		};

		renderHook(() => useGeolocation(options));

		await waitFor(() => {
			expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
		});

		const callArgs = mockGeolocation.getCurrentPosition.mock.calls[0];
		expect(callArgs[2]).toEqual({
			timeout: 5000,
			maximumAge: 30000,
			enableHighAccuracy: false,
		});
	});

	it("should set loading state during request", async () => {
		let resolvePosition: ((position: unknown) => void) | null = null;

		mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
			resolvePosition = success;
		});

		const { result } = renderHook(() => useGeolocation());

		await waitFor(() => {
			expect(result.current.state).toBe("loading");
		});

		act(() => {
			resolvePosition?.({
				coords: {
					latitude: 52.3676,
					longitude: 4.9041,
					accuracy: 10,
				},
				timestamp: Date.now(),
			});
		});

		await waitFor(() => {
			expect(result.current.state).toBe("success");
		});
	});
});
