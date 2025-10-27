"use client";

import clsx from "classnames";
import type { RouteSummary } from "../app/types";

interface RouteStatsProps {
	routes: RouteSummary[];
	activeRoute: number | null;
	onSelectRoute: (index: number) => void;
}

export function RouteStats({
	routes,
	activeRoute,
	onSelectRoute,
}: RouteStatsProps) {
	const primary = routes[activeRoute ?? 0];

	if (!primary) return null;

	return (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 panel px-4 py-3 w-[680px]">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-6">
					<Stat
						label="Distance"
						value={`${(primary.dist / 1000).toFixed(2)} km`}
					/>
					<Stat
						label="Est. time"
						value={`${Math.round(primary.duration / 60)} min`}
					/>
					<Stat label="Traffic lights (near)" value={`${primary.lights}`} />
					<Stat
						label="Near parks"
						value={`${Math.round(primary.parkAdjacency * 100)}%`}
					/>
					<Stat
						label="Score"
						value={`${(primary.score * 100).toFixed(0)}`}
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
								"px-3 py-1 rounded-lg border text-sm",
								routes[activeRoute ?? 0]?.id === r.id
									? "bg-brand-accent text-white border-brand-accent"
									: "border-neutral-300 hover:bg-neutral-100",
							)}
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
	label: string;
	value: string;
	suffix?: string;
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
