"use client";

import { useState } from "react";
import type { Coordinate } from "ors-client";
import type { NominatimResult } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

interface CitySearchProps {
	readonly onCitySelect: (lngLat: Coordinate, cityName: string) => void;
	readonly isVisible: boolean;
}

export function CitySearch({ onCitySelect, isVisible }: CitySearchProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<NominatimResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	async function searchCities(q: string) {
		if (!q.trim()) {
			setResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
			);

			if (!response.ok) {
				throw new Error("Failed to search cities");
			}

			const data: NominatimResult[] = await response.json();
			setResults(data);
		} catch (error) {
			console.error("City search error:", error);
			setResults([]);
		} finally {
			setIsSearching(false);
		}
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		searchCities(query);
	}

	function handleCitySelect(result: NominatimResult) {
		const lngLat: Coordinate = [parseFloat(result.lon), parseFloat(result.lat)];
		const cityName =
			result.address.city ||
			result.address.town ||
			result.address.village ||
			result.display_name.split(",")[0] ||
			"Selected location";

		onCitySelect(lngLat, cityName);
		setQuery("");
		setResults([]);
	}

	if (!isVisible) return null;

	return (
		<div className="fixed top-16 left-1/2 -translate-x-1/2 z-20 w-96 max-w-[90vw]">
			<div className="panel p-4 animate-slide-up">
				<h3 className="font-semibold text-brand mb-3">Find your city</h3>
				<form onSubmit={handleSubmit} className="mb-3">
					<div className="flex gap-2">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Enter city name..."
							className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
							aria-label="City name"
							autoComplete="off"
						/>
						<button
							type="submit"
							disabled={isSearching || !query.trim()}
							className={cn(
								"px-4 py-2 rounded-md transition-colors",
								isSearching || !query.trim()
									? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
									: "bg-brand text-white hover:bg-brand-accent",
							)}
							aria-label="Search for city"
						>
							{isSearching ? "..." : "Search"}
						</button>
					</div>
				</form>
				{results.length > 0 && (
					<div className="space-y-1 max-h-48 overflow-y-auto">
						{results.map((result) => {
							const cityName =
								result.address.city ||
								result.address.town ||
								result.address.village ||
								result.display_name.split(",")[0];

							return (
								<button
									key={result.place_id}
									type="button"
									onClick={() => handleCitySelect(result)}
									className="w-full text-left p-2 rounded hover:bg-neutral-100 transition-colors"
								>
									<div className="font-medium">{cityName}</div>
									<div className="text-sm text-neutral-600 truncate">
										{result.display_name}
									</div>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
