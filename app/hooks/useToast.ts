"use client";

import { useState, useCallback, useRef } from "react";
import type { Toast, ToastType } from "../lib/types";
import { generateId } from "../lib/utils";
import { TOAST_DURATION_MS, MAX_TOASTS } from "../lib/constants";

interface UseToastReturn {
	toasts: Toast[];
	addToast: (message: string, type?: ToastType, duration?: number) => string;
	removeToast: (id: string) => void;
	clearAllToasts: () => void;
}

export function useToast(): UseToastReturn {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

	const removeToast = useCallback((id: string) => {
		// Clear timeout if it exists
		const timeout = timeoutsRef.current.get(id);
		if (timeout) {
			clearTimeout(timeout);
			timeoutsRef.current.delete(id);
		}

		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const addToast = useCallback(
		(message: string, type: ToastType = "info", duration?: number): string => {
			const id = generateId();
			const toast: Toast = {
				id,
				message,
				type,
				duration: duration ?? TOAST_DURATION_MS,
				timestamp: Date.now(),
			};

			setToasts((prev) => {
				const newToasts = [toast, ...prev];
				// Limit number of toasts
				if (newToasts.length > MAX_TOASTS) {
					const removedToasts = newToasts.slice(MAX_TOASTS);
					// Clear timeouts for removed toasts
					removedToasts.forEach((removedToast) => {
						const timeout = timeoutsRef.current.get(removedToast.id);
						if (timeout) {
							clearTimeout(timeout);
							timeoutsRef.current.delete(removedToast.id);
						}
					});
					return newToasts.slice(0, MAX_TOASTS);
				}
				return newToasts;
			});

			// Set timeout for auto-removal
			if (toast.duration && toast.duration > 0) {
				const timeout = setTimeout(() => {
					removeToast(id);
				}, toast.duration);
				timeoutsRef.current.set(id, timeout);
			}

			return id;
		},
		[removeToast],
	);

	const clearAllToasts = useCallback(() => {
		// Clear all timeouts
		timeoutsRef.current.forEach((timeout) => {
			clearTimeout(timeout);
		});
		timeoutsRef.current.clear();
		setToasts([]);
	}, []);

	return {
		toasts,
		addToast,
		removeToast,
		clearAllToasts,
	};
}
