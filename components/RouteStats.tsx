"use client";

import clsx from "clsx";
import type { RouteSummary } from "@/app/lib/types";
import { formatDistance, formatDuration } from "@/app/lib/utils";
import { FEATURES } from "@/app/lib/constants";

interface RouteStatsProps {
	readonly routes: readonly RouteSummary[];
	readonly activeRoute: number | null;
	readonly onSelectRoute: (index: number) => void;
}

export function RouteStats({
	routes,
	activeRoute,
	onSelectRoute,
}: RouteStatsProps) {
	const primary = routes[activeRoute ?? 0];

	if (!primary) return null;

	return (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 panel px-4 py-3 w-[680px] max-w-[90vw]">
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div className="flex items-center gap-6 flex-wrap">
					<Stat label="Distance" value={formatDistance(primary.distance)} />
					<Stat label="Est. time" value={formatDuration(primary.duration)} />
					{FEATURES.ENABLE_TRAFFIC_LIGHTS_CHECK && (
						<Stat
							label="Traffic lights"
							value={`${primary.trafficLights.count}`}
						/>
					)}
					{FEATURES.ENABLE_PARK_ADJACENCY_CHECK && (
						<Stat
							label="Near parks"
							value={`${Math.round(primary.parkAdjacency * 100)}%`}
						/>
					)}
					<Stat
						label="Score"
						value={`${Math.round(primary.score * 100)}`}
						suffix="/100"
					/>
				</div>
				<div className="flex items-center gap-2">
					{routes.map((r, idx) => (
						<button
							key={r.id}
							type="button"
							onClick={() => onSelectRoute(idx)}
							className={clsx(
								"px-3 py-1 rounded-lg border text-sm transition-colors",
								routes[activeRoute ?? 0]?.id === r.id
									? "bg-brand-accent text-white border-brand-accent"
									: "border-neutral-300 hover:bg-neutral-100",
							)}
							aria-label={`Select route ${idx + 1}`}
						>
							Route {idx + 1}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

function Stat({
	label,
	value,
	suffix,
}: {
	readonly label: string;
	readonly value: string;
	readonly suffix?: string;
}) {
	return (
		<div>
			<div className="text-xs text-neutral-500">{label}</div>
			<div className="text-base font-semibold">
				{value}
				{suffix ?? ""}
			</div>
		</div>
	);
}
