import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RunPaths MVP",
  description: "Find pretty, low-stoplight running loops using OpenStreetMap + OpenRouteService",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
