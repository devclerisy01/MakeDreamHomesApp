import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.makedreamhomes.app",
	appName: "MakeDreamHomes",
	webDir: "dist",
	// WebView background for the load gap — matches the app's `--ion-background-
	// color` so the splash hand-off has no colour jump (and never black).
	backgroundColor: "#f4f6fb",
	plugins: {
		SplashScreen: {
			// Keep the branded splash up until the web app has mounted and calls
			// hide() — otherwise the native splash disappears the instant the
			// WebView surface exists, exposing a blank screen while JS loads.
			launchAutoHide: false,
			backgroundColor: "#f4f6fb",
			showSpinner: false,
			androidScaleType: "CENTER_CROP",
			splashFullScreen: true,
			splashImmersive: false,
		},
	},
};

export default config;
