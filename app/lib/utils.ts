import { clsx, type ClassValue } from "clsx";
import type { Coordinate, BoundingBox } from "./types";

/**
 * Utility function for conditional classnames using clsx
 */
export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

/**
 * Format distance in meters to human readable format
 */
export function formatDistance(meters: number): string {
	if (meters < 1000) {
		return `${Math.round(meters)}m`;
	}
	return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Format duration in seconds to human readable format
 * @param seconds - Duration in seconds
 * @param distanceMeters - Optional distance in meters to calculate using custom pace
 * @param paceMinPerKm - Optional pace in minutes per kilometer
 */
export function formatDuration(
	seconds: number,
	distanceMeters?: number,
	paceMinPerKm?: number,
): string {
	let totalSeconds = seconds;

	// If distance and pace are provided, calculate duration based on pace
	if (distanceMeters !== undefined && paceMinPerKm !== undefined) {
		const distanceKm = distanceMeters / 1000;
		totalSeconds = distanceKm * paceMinPerKm * 60;
	}

	const minutes = Math.round(totalSeconds / 60);
	if (minutes < 60) {
		return `${minutes}min`;
	}
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return `${hours}h ${remainingMinutes}min`;
}

/**
 * Format percentage as a string
 */
export function formatPercentage(value: number): string {
	return `${Math.round(value * 100)}%`;
}

/**
 * Generate a unique ID for toasts and other UI elements
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function for limiting function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}

/**
 * Throttle function for limiting function calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number,
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;
	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}

/**
 * Calculate bounding box from coordinates
 */
export function calculateBoundingBox(coordinates: Coordinate[]): BoundingBox {
	if (coordinates.length === 0) {
		throw new Error(
			"Cannot calculate bounding box for empty coordinates array",
		);
	}

	const lons = coordinates.map(([lon]) => lon);
	const lats = coordinates.map(([, lat]) => lat);

	return [
		Math.min(...lons), // minX
		Math.min(...lats), // minY
		Math.max(...lons), // maxX
		Math.max(...lats), // maxY
	];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
	coord1: Coordinate,
	coord2: Coordinate,
): number {
	const [lon1, lat1] = coord1;
	const [lon2, lat2] = coord2;

	const R = 6371e3; // Earth's radius in meters
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

/**
 * Validate coordinate format
 */
export function isValidCoordinate(coord: unknown): coord is Coordinate {
	return (
		Array.isArray(coord) &&
		coord.length === 2 &&
		typeof coord[0] === "number" &&
		typeof coord[1] === "number" &&
		coord[0] >= -180 &&
		coord[0] <= 180 &&
		coord[1] >= -90 &&
		coord[1] <= 90
	);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry async operation with exponential backoff
 */
export async function retry<T>(
	operation: () => Promise<T>,
	maxAttempts: number = 3,
	baseDelay: number = 1000,
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt === maxAttempts) {
				throw lastError;
			}

			const delay = baseDelay * Math.pow(2, attempt - 1);
			await sleep(delay);
		}
	}

	throw lastError;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
	try {
		return JSON.parse(json);
	} catch {
		return fallback;
	}
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "An unexpected error occurred";
}

/**
 * Check if code is running in browser
 */
export function isBrowser(): boolean {
	return typeof window !== "undefined";
}

/**
 * Get user's preferred language/locale
 */
export function getUserLocale(): string {
	if (!isBrowser()) return "en-US";
	return navigator.language || "en-US";
}

/**
 * Round number to specified decimal places
 */
export function roundTo(num: number, decimals: number): number {
	return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Clamp number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
