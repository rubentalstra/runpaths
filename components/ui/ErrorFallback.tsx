interface ErrorFallbackProps {
	readonly error: Error;
	readonly resetErrorBoundary: () => void;
}

export function ErrorFallback({
	error,
	resetErrorBoundary,
}: ErrorFallbackProps) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 animate-fade-in">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
						<svg
							className="w-4 h-4 text-red-600"
							fill="currentColor"
							viewBox="0 0 20 20"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<h2 className="text-lg font-semibold text-neutral-900">
						Something went wrong
					</h2>
				</div>

				<p className="text-neutral-600 mb-4">
					We encountered an unexpected error. Please try refreshing the page or
					contact support if the problem persists.
				</p>

				<details className="mb-4">
					<summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
						Error details
					</summary>
					<pre className="mt-2 text-xs bg-neutral-100 p-2 rounded overflow-auto max-h-32 text-neutral-800 font-mono">
						{error.message}
						{error.stack && (
							<>
								{"\n\n"}
								{error.stack}
							</>
						)}
					</pre>
				</details>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={resetErrorBoundary}
						className="flex-1 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
					>
						Try again
					</button>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="flex-1 bg-neutral-200 text-neutral-800 px-4 py-2 rounded-lg hover:bg-neutral-300 transition-colors"
					>
						Refresh page
					</button>
				</div>
			</div>
		</div>
	);
}
