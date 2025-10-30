/**
 * Utility functions for common operations throughout the application.
 *
 * @module utils
 */

import { clsx, type ClassValue } from "clsx";
import type { Coordinate, BoundingBox } from "./types";

/**
 * Combines class names using clsx.
 *
 * @param inputs - Class values to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

/**
 * Formats distance in meters to a human-readable string.
 *
 * @param meters - Distance in meters
 * @returns Formatted distance string (e.g., "150m" or "5.23km")
 */
export function formatDistance(meters: number): string {
	if (meters < 1000) {
		return `${Math.round(meters)}m`;
	}
	return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Formats duration in seconds to a human-readable string.
 *
 * If distance and pace are provided, calculates duration based on custom pace.
 *
 * @param seconds - Duration in seconds
 * @param distanceMeters - Optional distance in meters
 * @param paceMinPerKm - Optional pace in minutes per kilometer
 * @returns Formatted duration string (e.g., "45min" or "1h 30min")
 */
export function formatDuration(
	seconds: number,
	distanceMeters?: number,
	paceMinPerKm?: number,
): string {
	let totalSeconds = seconds;

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
 * Formats a decimal value as a percentage string.
 *
 * @param value - Value between 0 and 1
 * @returns Formatted percentage string (e.g., "75%")
 */
export function formatPercentage(value: number): string {
	return `${Math.round(value * 100)}%`;
}

/**
 * Generates a unique ID for UI elements.
 *
 * @returns Unique identifier string
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a debounced version of a function.
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
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
 * Creates a throttled version of a function.
 *
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
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
 * Calculates the bounding box from an array of coordinates.
 *
 * @param coordinates - Array of coordinates
 * @returns Bounding box [minX, minY, maxX, maxY]
 * @throws {Error} When coordinates array is empty
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
		Math.min(...lons),
		Math.min(...lats),
		Math.max(...lons),
		Math.max(...lats),
	];
}

/**
 * Calculates distance between two coordinates using the Haversine formula.
 *
 * @param coord1 - First coordinate [longitude, latitude]
 * @param coord2 - Second coordinate [longitude, latitude]
 * @returns Distance in meters
 */
export function calculateDistance(
	coord1: Coordinate,
	coord2: Coordinate,
): number {
	const [lon1, lat1] = coord1;
	const [lon2, lat2] = coord2;

	const R = 6371e3;
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
 * Validates whether a value is a valid coordinate.
 *
 * @param coord - Value to validate
 * @returns True if valid coordinate, false otherwise
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
 * Delays execution for a specified duration.
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff.
 *
 * @param operation - Async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Result of the operation
 * @throws {Error} Last error if all attempts fail
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
 * Safely parses JSON with fallback value.
 *
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
	try {
		return JSON.parse(json);
	} catch {
		return fallback;
	}
}

/**
 * Formats an error for user-friendly display.
 *
 * @param error - Error object or value
 * @returns Formatted error message
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
 * Checks if code is running in a browser environment.
 *
 * @returns True if running in browser, false otherwise
 */
export function isBrowser(): boolean {
	return typeof window !== "undefined";
}

/**
 * Gets the user's preferred language/locale.
 *
 * @returns Locale string (e.g., "en-US")
 */
export function getUserLocale(): string {
	if (!isBrowser()) return "en-US";
	return navigator.language || "en-US";
}

/**
 * Rounds a number to a specified number of decimal places.
 *
 * @param num - Number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
export function roundTo(num: number, decimals: number): number {
	return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Clamps a number between minimum and maximum values.
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
