"use client";

import { useId } from "react";
import clsx from "classnames";
import {
	MIN_DISTANCE_KM,
	MAX_DISTANCE_KM,
	DISTANCE_STEP,
	QUICK_DISTANCES,
	MIN_PREFERENCE,
	MAX_PREFERENCE,
	PREFERENCE_STEP,
} from "../app/constants";

interface ControlsProps {
	kms: number;
	setKms: (value: number) => void;
	avoidLights: number;
	setAvoidLights: (value: number) => void;
	preferParks: number;
	setPreferParks: (value: number) => void;
	onFindRoutes: () => void;
	isPending: boolean;
}

export function Controls({
	kms,
	setKms,
	avoidLights,
	setAvoidLights,
	preferParks,
	setPreferParks,
	onFindRoutes,
	isPending,
}: ControlsProps) {
	const distanceId = useId();
	const avoidId = useId();
	const preferId = useId();

	return (
		<div className="fixed left-4 top-1/2 -translate-y-1/2 w-[360px] z-20 panel p-4 space-y-4">
			<h2 className="text-lg font-semibold text-brand">Plan your loop</h2>
			<div className="space-y-1">
				<label htmlFor={distanceId} className="text-sm font-medium">
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
				/>
				<div className="flex gap-2">
					{QUICK_DISTANCES.map((k) => (
						<button
							key={k}
							type="button"
							onClick={() => setKms(k)}
							className={clsx(
								"px-3 py-1 rounded-full border text-sm",
								kms === k
									? "bg-brand-accent text-white border-brand-accent"
									: "border-neutral-300 hover:bg-neutral-100",
							)}
						>
							{k}k
						</button>
					))}
				</div>
			</div>
			<div className="space-y-2">
				<div className="flex justify-between">
					<label htmlFor={avoidId} className="text-sm font-medium">
						Avoid traffic lights
					</label>
					<span className="text-sm">{Math.round(avoidLights * 100)}%</span>
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
				/>
			</div>
			<div className="space-y-2">
				<div className="flex justify-between">
					<label htmlFor={preferId} className="text-sm font-medium">
						Prefer parks
					</label>
					<span className="text-sm">{Math.round(preferParks * 100)}%</span>
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
				/>
			</div>
			<button
				type="button"
				onClick={onFindRoutes}
				disabled={isPending}
				className="w-full bg-brand text-white rounded-xl py-3 hover:bg-brand-dark transition disabled:opacity-50"
			>
				{isPending ? "Finding routes..." : "Find routes"}
			</button>
			<div className="text-xs text-neutral-500">
				Tiles © OpenStreetMap contributors. Routing by OpenRouteService. Data
				via Overpass API.
			</div>
		</div>
	);
}
