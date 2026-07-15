import type { Config } from "tailwindcss";

/**
 * Design tokens for the MakeDreamHomes mobile app — mirrors the web frontend's
 * `tailwind.config.ts` so the two share the same colour/shadow vocabulary.
 * Tailwind v4 reads this via the `@config` directive in `src/theme/tailwind.css`.
 */
const config: Config = {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					"Plus Jakarta Sans",
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI",
					"Roboto",
					"Helvetica",
					"Arial",
					"sans-serif",
				],
			},
			colors: {
				brand: {
					DEFAULT: "#14181F",
					dark: "#000000",
				},
				primary: {
					DEFAULT: "#26428B",
					dark: "#1C3259",
					light: "#EEF2F9",
				},
				ink: "#000",
				muted: {
					DEFAULT: "#3C4452",
					light: "#667085",
				},
				line: "#E7E9EE",
				surface: {
					DEFAULT: "#FFFFFF",
					muted: "#F8F8FA",
					dark: "#14181F",
				},
				star: "#FBBF24",
				success: "#22C55E",
				danger: "#EF4444",
			},
			maxWidth: {
				container: "1440px",
			},
			boxShadow: {
				card: "0 6px 20px rgba(16, 24, 40, 0.06)",
				"card-sm": "0 2px 8px rgba(16, 24, 40, 0.05)",
			},
		},
	},
	plugins: [],
};

export default config;
