"use client";

import { useEffect } from "react";
import type { Toast as ToastType } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

/**
 * Props for the Toast component.
 */
interface ToastProps {
	readonly toast: ToastType;
	readonly onClose: () => void;
}

/**
 * Individual toast notification.
 *
 * Displays a notification message with automatic dismissal after duration.
 * Supports different types (success, error, info, warning) with color-coded styling.
 *
 * @param props - Component properties
 */
function Toast({ toast, onClose }: ToastProps) {
	useEffect(() => {
		if (toast.duration && toast.duration > 0) {
			const timer = setTimeout(onClose, toast.duration);
			return () => clearTimeout(timer);
		}
	}, [toast.duration, onClose]);

	const bgColors = {
		success: "bg-green-500",
		error: "bg-red-500",
		info: "bg-blue-500",
		warning: "bg-yellow-500",
	};

	return (
		<div
			className={cn(
				"flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-white max-w-sm animate-slide-up",
				bgColors[toast.type],
			)}
			role="alert"
			aria-live="polite"
		>
			<span className="flex-1 text-sm">{toast.message}</span>
			<button
				type="button"
				onClick={onClose}
				className="text-white hover:text-gray-200 transition-colors text-xl leading-none"
				aria-label="Close notification"
			>
				×
			</button>
		</div>
	);
}

/**
 * Props for the ToastContainer component.
 */
interface ToastContainerProps {
	readonly toasts: readonly ToastType[];
	readonly removeToast: (id: string) => void;
}

/**
 * Container for displaying multiple toast notifications.
 *
 * Renders a stack of toast notifications in the top-right corner.
 *
 * @param props - Component properties
 */
export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
	if (toasts.length === 0) return null;

	return (
		<div className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite">
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					toast={toast}
					onClose={() => removeToast(toast.id)}
				/>
			))}
		</div>
	);
}
