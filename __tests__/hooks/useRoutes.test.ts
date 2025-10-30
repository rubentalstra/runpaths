/**
 * Tests for the useRoutes hook.
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useRoutes } from "@/app/hooks/useRoutes";
import { findRoutes } from "@/app/actions";
import type {
	RouteSummary,
	Preferences,
	RouteGenerationResponse,
} from "@/app/lib/types";

// Mock the findRoutes action
jest.mock("@/app/actions", () => ({
	findRoutes: jest.fn(),
}));

// Mock use-debounce to avoid delays in tests
jest.mock("use-debounce", () => ({
	useDebounce: (fn: unknown) => [fn, () => {}, () => {}],
}));

const mockFindRoutes = findRoutes as jest.MockedFunction<typeof findRoutes>;

describe("useRoutes", () => {
	const mockRoutes: RouteSummary[] = [
		{
			id: 1,
			geojson: {} as never,
			distance: 5000,
			duration: 1800,
			trafficLights: { count: 5, positions: [] },
			parkAdjacency: 0.7,
			score: 85,
			metadata: {
				seedUsed: 11,
				generatedAt: new Date(),
				apiVersion: "1.0",
			},
		},
		{
			id: 2,
			geojson: {} as never,
			distance: 5100,
			duration: 1860,
			trafficLights: { count: 6, positions: [] },
			parkAdjacency: 0.6,
			score: 80,
			metadata: {
				seedUsed: 22,
				generatedAt: new Date(),
				apiVersion: "1.0",
			},
		},
	];

	const mockResponse: RouteGenerationResponse = {
		routes: mockRoutes,
		metadata: {
			requestId: "test-request",
			processingTimeMs: 500,
			apiCalls: 2,
		},
	};

	const mockPreferences: Preferences = {
		distanceMeters: 5000,
		avoidTrafficLights: 0.8,
		preferParks: 0.7,
		paceMinPerKm: 6,
		colorblindMode: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should initialize with empty state", () => {
		const { result } = renderHook(() => useRoutes());

		expect(result.current.routes).toEqual([]);
		expect(result.current.activeRoute).toBeNull();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("should generate routes successfully", async () => {
		mockFindRoutes.mockResolvedValueOnce(mockResponse);

		const { result } = renderHook(() => useRoutes());

		await act(async () => {
			await result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		await waitFor(() => {
			expect(result.current.routes).toEqual(mockRoutes);
		});

		expect(result.current.activeRoute).toBe(0);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("should handle route generation error", async () => {
		const errorMessage = "Failed to fetch routes";
		mockFindRoutes.mockRejectedValueOnce(new Error(errorMessage));

		const { result } = renderHook(() => useRoutes());

		await act(async () => {
			await result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		await waitFor(() => {
			expect(result.current.error).toBe(errorMessage);
		});

		expect(result.current.routes).toEqual([]);
		expect(result.current.activeRoute).toBeNull();
		expect(result.current.isLoading).toBe(false);
	});

	it("should set active route", async () => {
		mockFindRoutes.mockResolvedValueOnce(mockResponse);

		const { result } = renderHook(() => useRoutes());

		await act(async () => {
			await result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		act(() => {
			result.current.setActiveRoute(1);
		});

		expect(result.current.activeRoute).toBe(1);
	});

	it("should clear active route when set to null", async () => {
		mockFindRoutes.mockResolvedValueOnce(mockResponse);

		const { result } = renderHook(() => useRoutes());

		await act(async () => {
			await result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		await waitFor(() => {
			expect(result.current.activeRoute).toBe(0);
		});

		act(() => {
			result.current.setActiveRoute(null);
		});

		expect(result.current.activeRoute).toBeNull();
	});

	it("should ignore invalid active route index", async () => {
		mockFindRoutes.mockResolvedValueOnce(mockResponse);

		const { result } = renderHook(() => useRoutes());

		await act(async () => {
			await result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		await waitFor(() => {
			expect(result.current.activeRoute).toBe(0);
		});

		act(() => {
			result.current.setActiveRoute(999);
		});

		expect(result.current.activeRoute).toBe(0);

		act(() => {
			result.current.setActiveRoute(-1);
		});

		expect(result.current.activeRoute).toBe(0);
	});

	it("should clear routes", async () => {
		mockFindRoutes.mockResolvedValueOnce(mockResponse);

		const { result } = renderHook(() => useRoutes());

		await act(async () => {
			await result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		await waitFor(() => {
			expect(result.current.routes).toHaveLength(2);
		});

		act(() => {
			result.current.clearRoutes();
		});

		expect(result.current.routes).toEqual([]);
		expect(result.current.activeRoute).toBeNull();
		expect(result.current.error).toBeNull();
	});

	it("should clear error", async () => {
		mockFindRoutes.mockRejectedValueOnce(new Error("Test error"));

		const { result } = renderHook(() => useRoutes());

		await act(async () => {
			await result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		await waitFor(() => {
			expect(result.current.error).not.toBeNull();
		});

		act(() => {
			result.current.clearError();
		});

		expect(result.current.error).toBeNull();
	});

	it("should handle empty routes result", async () => {
		const emptyResponse: RouteGenerationResponse = {
			routes: [],
			metadata: {
				requestId: "test-request",
				processingTimeMs: 100,
				apiCalls: 0,
			},
		};
		mockFindRoutes.mockResolvedValueOnce(emptyResponse);

		const { result } = renderHook(() => useRoutes());

		await act(async () => {
			await result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		await waitFor(() => {
			expect(result.current.routes).toEqual([]);
		});

		expect(result.current.activeRoute).toBeNull();
	});

	it("should handle race conditions", async () => {
		const firstRoutes: RouteSummary[] = [
			{
				id: 1,
				geojson: {} as never,
				distance: 5000,
				duration: 1800,
				trafficLights: { count: 3, positions: [] },
				parkAdjacency: 0.5,
				score: 75,
				metadata: {
					seedUsed: 11,
					generatedAt: new Date(),
					apiVersion: "1.0",
				},
			},
		];

		const secondRoutes: RouteSummary[] = [
			{
				id: 2,
				geojson: {} as never,
				distance: 5100,
				duration: 1860,
				trafficLights: { count: 4, positions: [] },
				parkAdjacency: 0.6,
				score: 80,
				metadata: {
					seedUsed: 22,
					generatedAt: new Date(),
					apiVersion: "1.0",
				},
			},
		];

		const firstResponse: RouteGenerationResponse = {
			routes: firstRoutes,
			metadata: {
				requestId: "first",
				processingTimeMs: 500,
				apiCalls: 1,
			},
		};

		const secondResponse: RouteGenerationResponse = {
			routes: secondRoutes,
			metadata: {
				requestId: "second",
				processingTimeMs: 400,
				apiCalls: 1,
			},
		};

		let firstResolve: ((value: RouteGenerationResponse) => void) | null = null;
		let secondResolve: ((value: RouteGenerationResponse) => void) | null = null;

		mockFindRoutes
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						firstResolve = resolve;
					}),
			)
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						secondResolve = resolve;
					}),
			);

		const { result } = renderHook(() => useRoutes());

		// Start first request
		act(() => {
			result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		// Start second request
		act(() => {
			result.current.generateRoutes([4.9041, 52.3676], {
				...mockPreferences,
				distanceMeters: 10000,
			});
		});

		// Resolve first request (should be ignored)
		await act(async () => {
			firstResolve?.(firstResponse);
		});

		// Resolve second request (should be used)
		await act(async () => {
			secondResolve?.(secondResponse);
		});

		await waitFor(() => {
			expect(result.current.routes).toEqual(secondRoutes);
		});
	});

	it("should show loading state during route generation", async () => {
		let resolve: ((value: RouteGenerationResponse) => void) | null = null;
		mockFindRoutes.mockImplementationOnce(
			() =>
				new Promise((res) => {
					resolve = res;
				}),
		);

		const { result } = renderHook(() => useRoutes());

		act(() => {
			result.current.generateRoutes([4.9041, 52.3676], mockPreferences);
		});

		expect(result.current.isLoading).toBe(true);

		await act(async () => {
			resolve?.(mockResponse);
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});
	});
});
