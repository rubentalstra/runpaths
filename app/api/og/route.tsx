import { ImageResponse } from "next/og";

export const runtime = "nodejs";

/**
 * Generate Open Graph image for RunPaths
 */
export async function GET() {
	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#fafafa",
				backgroundImage:
					"radial-gradient(circle at 25px 25px, #e5e5e5 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e5e5e5 2%, transparent 0%)",
				backgroundSize: "100px 100px",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "white",
					borderRadius: "24px",
					padding: "60px 80px",
					boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
				}}
			>
				{/* Running icon */}
				<div
					style={{
						fontSize: 120,
						marginBottom: "20px",
					}}
				>
					🏃
				</div>

				{/* Title */}
				<div
					style={{
						fontSize: 72,
						fontWeight: 800,
						background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
						backgroundClip: "text",
						color: "transparent",
						marginBottom: "20px",
						letterSpacing: "-0.02em",
					}}
				>
					RunPaths
				</div>

				{/* Description */}
				<div
					style={{
						fontSize: 32,
						color: "#525252",
						textAlign: "center",
						maxWidth: "800px",
						lineHeight: 1.4,
					}}
				>
					Discover running loops tailored to your distance
				</div>
			</div>

			{/* URL footer */}
			<div
				style={{
					position: "absolute",
					bottom: "40px",
					fontSize: 28,
					color: "#737373",
				}}
			>
				runpaths.vercel.app
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
		},
	);
}
