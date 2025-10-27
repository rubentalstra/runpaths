"use client";

import { useState, useEffect } from "react";

interface ToastProps {
	message: string;
	type: "success" | "error" | "info";
	onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
	useEffect(() => {
		const timer = setTimeout(onClose, 5000);
		return () => clearTimeout(timer);
	}, [onClose]);

	const bgColor = {
		success: "bg-green-500",
		error: "bg-red-500",
		info: "bg-blue-500",
	}[type];

	return (
		<div
			className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 max-w-sm`}
		>
			<span className="flex-1">{message}</span>
			<button
				type="button"
				onClick={onClose}
				className="text-white hover:text-gray-200"
				aria-label="Close"
			>
				×
			</button>
		</div>
	);
}

interface ToastContainerProps {
	toasts: Array<{
		id: number;
		message: string;
		type: "success" | "error" | "info";
	}>;
	removeToast: (id: number) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
	return (
		<div className="fixed top-0 right-0 z-50 p-4 space-y-2">
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					message={toast.message}
					type={toast.type}
					onClose={() => removeToast(toast.id)}
				/>
			))}
		</div>
	);
}

export function useToast() {
	const [toasts, setToasts] = useState<
		Array<{ id: number; message: string; type: "success" | "error" | "info" }>
	>([]);

	const addToast = (
		message: string,
		type: "success" | "error" | "info" = "info",
	) => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
	};

	const removeToast = (id: number) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	};

	return { toasts, addToast, removeToast };
}
