/**
 * Tests for the useToast hook.
 */

import { renderHook, act } from "@testing-library/react";
import { useToast } from "@/app/hooks/useToast";

describe("useToast", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
	});

	it("should initialize with no toasts", () => {
		const { result } = renderHook(() => useToast());

		expect(result.current.toasts).toEqual([]);
	});

	it("should add success toast", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.addToast("Operation successful", "success");
		});

		expect(result.current.toasts).toHaveLength(1);
		expect(result.current.toasts[0].message).toBe("Operation successful");
		expect(result.current.toasts[0].type).toBe("success");
	});

	it("should add error toast", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.addToast("Operation failed", "error");
		});

		expect(result.current.toasts).toHaveLength(1);
		expect(result.current.toasts[0].message).toBe("Operation failed");
		expect(result.current.toasts[0].type).toBe("error");
	});

	it("should add info toast by default", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.addToast("Information message");
		});

		expect(result.current.toasts).toHaveLength(1);
		expect(result.current.toasts[0].message).toBe("Information message");
		expect(result.current.toasts[0].type).toBe("info");
	});

	it("should auto-remove toast after duration", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.addToast("Auto-hide message", "info", 2000);
		});

		expect(result.current.toasts).toHaveLength(1);

		act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(result.current.toasts).toHaveLength(0);
	});

	it("should remove toast manually", () => {
		const { result } = renderHook(() => useToast());

		let toastId: string = "";
		act(() => {
			toastId = result.current.addToast("Manual remove");
		});

		expect(result.current.toasts).toHaveLength(1);

		act(() => {
			result.current.removeToast(toastId);
		});

		expect(result.current.toasts).toHaveLength(0);
	});

	it("should add multiple toasts", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.addToast("First message", "success");
			result.current.addToast("Second message", "error");
			result.current.addToast("Third message", "info");
		});

		expect(result.current.toasts).toHaveLength(3);
		expect(result.current.toasts[0].message).toBe("Third message");
		expect(result.current.toasts[1].message).toBe("Second message");
		expect(result.current.toasts[2].message).toBe("First message");
	});

	it("should limit maximum number of toasts", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			// Add 6 toasts (MAX_TOASTS is 5)
			for (let i = 1; i <= 6; i++) {
				result.current.addToast(`Message ${i}`);
			}
		});

		expect(result.current.toasts).toHaveLength(5);
		expect(result.current.toasts[0].message).toBe("Message 6");
		expect(result.current.toasts[4].message).toBe("Message 2");
	});

	it("should clear all toasts", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.addToast("First", "success");
			result.current.addToast("Second", "error");
			result.current.addToast("Third", "info");
		});

		expect(result.current.toasts).toHaveLength(3);

		act(() => {
			result.current.clearAllToasts();
		});

		expect(result.current.toasts).toHaveLength(0);
	});

	it("should clear timeouts when removing toast manually", () => {
		const { result } = renderHook(() => useToast());

		let toastId: string = "";
		act(() => {
			toastId = result.current.addToast("Message", "info", 5000);
		});

		act(() => {
			result.current.removeToast(toastId);
		});

		// Should not show again after timeout
		act(() => {
			jest.advanceTimersByTime(5000);
		});

		expect(result.current.toasts).toHaveLength(0);
	});

	it("should return toast id when adding", () => {
		const { result } = renderHook(() => useToast());

		let toastId: string = "";
		act(() => {
			toastId = result.current.addToast("Test message");
		});

		expect(toastId).toBeTruthy();
		expect(typeof toastId).toBe("string");
		expect(result.current.toasts[0].id).toBe(toastId);
	});

	it("should handle removing non-existent toast", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.addToast("Test");
		});

		expect(result.current.toasts).toHaveLength(1);

		act(() => {
			result.current.removeToast("non-existent-id");
		});

		expect(result.current.toasts).toHaveLength(1);
	});
});
