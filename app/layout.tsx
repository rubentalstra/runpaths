import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "RunPaths - Find Beautiful Running Routes",
		template: "%s | RunPaths",
	},
	description:
		"Discover scenic, low-traffic running loops tailored to your preferences. Avoid traffic lights and find routes near parks using OpenStreetMap and OpenRouteService.",
	keywords: [
		"running",
		"jogging",
		"routes",
		"paths",
		"exercise",
		"fitness",
		"openstreetmap",
		"park running",
	],
	authors: [{ name: "Ruben Talstra" }],
	creator: "Ruben Talstra",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://runpaths.app",
		title: "RunPaths - Find Beautiful Running Routes",
		description:
			"Discover scenic, low-traffic running loops near you. Avoid traffic lights and find park routes.",
		siteName: "RunPaths",
	},
	twitter: {
		card: "summary_large_image",
		title: "RunPaths - Find Beautiful Running Routes",
		description:
			"Discover scenic, low-traffic running loops near you. Avoid traffic lights and find park routes.",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	userScalable: true,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fafafa" },
		{ media: "(prefers-color-scheme: dark)", color: "#1D282D" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="bg-neutral-50 text-neutral-900 antialiased">
				{children}
			</body>
		</html>
	);
}
