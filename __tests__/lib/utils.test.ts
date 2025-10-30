/**
 * Tests for utility functions.
 */

import {
	formatDistance,
	formatDuration,
	formatPercentage,
	generateId,
	calculateDistance,
	isValidCoordinate,
	clamp,
	roundTo,
} from "@/app/lib/utils";

describe("formatDistance", () => {
	it("should format distances under 1000m as meters", () => {
		expect(formatDistance(500)).toBe("500m");
		expect(formatDistance(999)).toBe("999m");
	});

	it("should format distances over 1000m as kilometers", () => {
		expect(formatDistance(1000)).toBe("1.00km");
		expect(formatDistance(5230)).toBe("5.23km");
		expect(formatDistance(10000)).toBe("10.00km");
	});
});

describe("formatDuration", () => {
	it("should format duration under 60 minutes", () => {
		expect(formatDuration(1800)).toBe("30min");
		expect(formatDuration(3000)).toBe("50min");
	});

	it("should format duration over 60 minutes with hours", () => {
		expect(formatDuration(3600)).toBe("1h 0min");
		expect(formatDuration(5400)).toBe("1h 30min");
		expect(formatDuration(7200)).toBe("2h 0min");
	});

	it("should calculate duration based on custom pace", () => {
		const distanceMeters = 5000;
		const paceMinPerKm = 6;
		const result = formatDuration(0, distanceMeters, paceMinPerKm);
		expect(result).toBe("30min");
	});
});

describe("formatPercentage", () => {
	it("should format decimal values as percentages", () => {
		expect(formatPercentage(0.5)).toBe("50%");
		expect(formatPercentage(0.75)).toBe("75%");
		expect(formatPercentage(1)).toBe("100%");
		expect(formatPercentage(0)).toBe("0%");
	});
});

describe("generateId", () => {
	it("should generate unique IDs", () => {
		const id1 = generateId();
		const id2 = generateId();
		expect(id1).not.toBe(id2);
	});

	it("should generate IDs with correct format", () => {
		const id = generateId();
		expect(id).toMatch(/^\d+-[a-z0-9]+$/);
	});
});

describe("calculateDistance", () => {
	it("should calculate distance between two coordinates", () => {
		const amsterdam: [number, number] = [4.8952, 52.3702];
		const rotterdam: [number, number] = [4.4777, 51.9244];

		const distance = calculateDistance(amsterdam, rotterdam);
		expect(distance).toBeGreaterThan(50000);
		expect(distance).toBeLessThan(60000);
	});

	it("should return 0 for same coordinates", () => {
		const coord: [number, number] = [4.8952, 52.3702];
		const distance = calculateDistance(coord, coord);
		expect(distance).toBeLessThan(1);
	});
});

describe("isValidCoordinate", () => {
	it("should validate correct coordinates", () => {
		expect(isValidCoordinate([4.8952, 52.3702])).toBe(true);
		expect(isValidCoordinate([0, 0])).toBe(true);
		expect(isValidCoordinate([-180, -90])).toBe(true);
		expect(isValidCoordinate([180, 90])).toBe(true);
	});

	it("should reject invalid coordinates", () => {
		expect(isValidCoordinate([181, 0])).toBe(false);
		expect(isValidCoordinate([0, 91])).toBe(false);
		expect(isValidCoordinate([1, 2, 3])).toBe(false);
		expect(isValidCoordinate("not a coordinate")).toBe(false);
		expect(isValidCoordinate(null)).toBe(false);
		expect(isValidCoordinate(undefined)).toBe(false);
	});
});

describe("clamp", () => {
	it("should clamp values within range", () => {
		expect(clamp(5, 0, 10)).toBe(5);
		expect(clamp(-5, 0, 10)).toBe(0);
		expect(clamp(15, 0, 10)).toBe(10);
	});

	it("should handle edge cases", () => {
		expect(clamp(0, 0, 10)).toBe(0);
		expect(clamp(10, 0, 10)).toBe(10);
	});
});

describe("roundTo", () => {
	it("should round to specified decimal places", () => {
		expect(roundTo(3.14159, 2)).toBe(3.14);
		expect(roundTo(3.14159, 0)).toBe(3);
		expect(roundTo(3.14159, 4)).toBe(3.1416);
	});
});
