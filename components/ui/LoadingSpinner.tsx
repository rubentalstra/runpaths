import { cn } from "@/app/lib/utils";

/**
 * Props for the LoadingSpinner component.
 */
interface LoadingSpinnerProps {
	readonly size?: "sm" | "md" | "lg";
	readonly className?: string;
}

/**
 * Loading spinner component for async operations.
 *
 * Displays an animated circular spinner with configurable size.
 *
 * @param props - Component properties
 */
export function LoadingSpinner({
	size = "md",
	className,
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-8 h-8",
		lg: "w-12 h-12",
	} as const;

	return (
		<div className={cn("flex items-center justify-center", className)}>
			<div
				className={cn(
					"animate-spin rounded-full border-2 border-neutral-300 border-t-brand",
					sizeClasses[size],
				)}
				aria-hidden="true"
			/>
			<span className="sr-only">Loading...</span>
		</div>
	);
}
