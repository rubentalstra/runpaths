"use client";

import { useId } from "react";
import { cn } from "@/app/lib/utils";
import {
	MIN_DISTANCE_KM,
	MAX_DISTANCE_KM,
	DISTANCE_STEP,
	QUICK_DISTANCES,
	MIN_PREFERENCE,
	MAX_PREFERENCE,
	PREFERENCE_STEP,
	MIN_PACE_MIN_PER_KM,
	MAX_PACE_MIN_PER_KM,
	PACE_STEP,
	FEATURES,
} from "@/app/lib/constants";

interface ControlsProps {
	readonly kms: number;
	readonly setKms: (value: number) => void;
	readonly avoidLights: number;
	readonly setAvoidLights: (value: number) => void;
	readonly preferParks: number;
	readonly setPreferParks: (value: number) => void;
	readonly pace: number;
	readonly setPace: (value: number) => void;
	readonly onFindRoutes: () => void;
	readonly isPending: boolean;
}

export function Controls({
	kms,
	setKms,
	avoidLights,
	setAvoidLights,
	preferParks,
	setPreferParks,
	pace,
	setPace,
	onFindRoutes,
	isPending,
}: ControlsProps) {
	const distanceId = useId();
	const avoidId = useId();
	const preferId = useId();
	const paceId = useId();

	// Format pace display (e.g., "5:30" for 5.5 min/km)
	const formatPace = (minPerKm: number): string => {
		const minutes = Math.floor(minPerKm);
		const seconds = Math.round((minPerKm - minutes) * 60);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	return (
		<div className="fixed left-4 top-1/2 -translate-y-1/2 w-[360px] max-w-[90vw] z-20 panel p-4 space-y-4">
			<h2 className="text-lg font-semibold text-brand">Plan your loop</h2>

			{/* Distance control */}
			<div className="space-y-1">
				<label htmlFor={distanceId} className="text-sm font-medium block">
					Target distance: <span className="text-brand-accent">{kms} km</span>
				</label>
				<input
					id={distanceId}
					type="range"
					min={MIN_DISTANCE_KM}
					max={MAX_DISTANCE_KM}
					step={DISTANCE_STEP}
					value={kms}
					onChange={(e) => setKms(Number(e.target.value))}
					className="w-full"
					aria-label={`Distance: ${kms} kilometers`}
				/>
				<div className="flex gap-2">
					{QUICK_DISTANCES.map((k) => (
						<button
							key={k}
							type="button"
							onClick={() => setKms(k)}
							className={cn(
								"px-3 py-1 rounded-full border text-sm transition-colors font-semibold",
								kms === k
									? "bg-brand-accent text-brand-dark border-brand-accent shadow-sm"
									: "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400",
							)}
							aria-label={`Set distance to ${k} kilometers`}
						>
							{k}k
						</button>
					))}
				</div>
			</div>

			{/* Avoid Traffic Lights - Only show if feature is enabled */}
			{FEATURES.ENABLE_TRAFFIC_LIGHTS_CHECK && (
				<div className="space-y-2">
					<div className="flex justify-between">
						<label htmlFor={avoidId} className="text-sm font-medium">
							Avoid traffic lights
						</label>
						<span className="text-sm text-neutral-600">
							{Math.round(avoidLights * 100)}%
						</span>
					</div>
					<input
						id={avoidId}
						type="range"
						min={MIN_PREFERENCE}
						max={MAX_PREFERENCE}
						step={PREFERENCE_STEP}
						value={avoidLights}
						onChange={(e) => setAvoidLights(Number(e.target.value))}
						className="w-full"
						aria-label={`Avoid traffic lights: ${Math.round(avoidLights * 100)} percent`}
					/>
				</div>
			)}

			{/* Prefer Parks - Only show if feature is enabled */}
			{FEATURES.ENABLE_PARK_ADJACENCY_CHECK && (
				<div className="space-y-2">
					<div className="flex justify-between">
						<label htmlFor={preferId} className="text-sm font-medium">
							Prefer parks
						</label>
						<span className="text-sm text-neutral-600">
							{Math.round(preferParks * 100)}%
						</span>
					</div>
					<input
						id={preferId}
						type="range"
						min={MIN_PREFERENCE}
						max={MAX_PREFERENCE}
						step={PREFERENCE_STEP}
						value={preferParks}
						onChange={(e) => setPreferParks(Number(e.target.value))}
						className="w-full"
						aria-label={`Prefer parks: ${Math.round(preferParks * 100)} percent`}
					/>
				</div>
			)}

			{/* Running Pace */}
			<div className="space-y-2">
				<div className="flex justify-between">
					<label htmlFor={paceId} className="text-sm font-medium">
						Running pace
					</label>
					<span className="text-sm text-neutral-600">
						{formatPace(pace)} min/km
					</span>
				</div>
				<input
					id={paceId}
					type="range"
					min={MIN_PACE_MIN_PER_KM}
					max={MAX_PACE_MIN_PER_KM}
					step={PACE_STEP}
					value={pace}
					onChange={(e) => setPace(Number(e.target.value))}
					className="w-full"
					aria-label={`Running pace: ${formatPace(pace)} minutes per kilometer`}
				/>
				<div className="text-xs text-neutral-500">
					Faster runners: 3-5 min/km • Casual joggers: 6-8 min/km
				</div>
			</div>

			{/* Find routes button */}
			<button
				type="button"
				onClick={onFindRoutes}
				disabled={isPending}
				className={cn(
					"w-full rounded-xl py-3 transition-colors font-bold shadow-md",
					isPending
						? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
						: "bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]",
				)}
				aria-label="Find running routes"
			>
				{isPending ? "Finding routes..." : "Find routes"}
			</button>

			{/* Attribution */}
			<div className="text-xs text-neutral-500 leading-relaxed">
				Tiles © OpenStreetMap contributors. Routing by OpenRouteService. Data
				via Overpass API.
			</div>
		</div>
	);
}
