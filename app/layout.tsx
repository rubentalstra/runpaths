import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

/**
 * Application metadata for SEO and social media sharing.
 */
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
	metadataBase: new URL("https://runpaths.vercel.app"),
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://runpaths.vercel.app",
		title: "RunPaths - Find Beautiful Running Routes",
		description:
			"Discover scenic, low-traffic running loops near you. Avoid traffic lights and find park routes.",
		siteName: "RunPaths",
		images: [
			{
				url: "/api/og",
				width: 1200,
				height: 630,
				alt: "RunPaths - Find Beautiful Running Routes",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "RunPaths - Find Beautiful Running Routes",
		description:
			"Discover scenic, low-traffic running loops near you. Avoid traffic lights and find park routes.",
		images: ["/api/og"],
	},
	robots: {
		index: true,
		follow: true,
	},
};

/**
 * Viewport configuration for responsive design.
 */
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

/**
 * Root layout component for the application.
 *
 * Sets up the HTML structure and applies global styles.
 *
 * @param children - Child components to render
 */
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="bg-neutral-50 text-neutral-900 antialiased">
				{children}
				<SpeedInsights />
				<Analytics />
			</body>
		</html>
	);
}
