import { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Capacitor } from "@capacitor/core";
import { SplashScreen as NativeSplash } from "@capacitor/splash-screen";

import { SplashScreen } from "@/components/splash/SplashScreen";
import { useSplash } from "@/hooks/useSplash";

/* Fonts + theme CSS are imported HERE (the eager entry) rather than in App.tsx,
   so the splash is fully styled before the lazy app chunk loads.
   Order matters: Plus Jakarta Sans first, then Tailwind (which declares the
   cascade-layer order incl. `ionic`), then Ionic, then theme. */
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@/theme/tailwind.css";
import "@/theme/ionic.css";
import "@/theme/variables.css";
import "@/theme/app.css";

// The heavy app (Ionic + router + all pages) is lazy-loaded so the branded
// splash can paint after just React + the small splash chunk — instead of
// waiting for the whole ~1.7MB bundle. The app streams in behind the splash.
const App = lazy(() => import("./App"));

function Root() {
	const splash = useSplash();

	// Hide the native OS (white) splash once the branded splash overlay has
	// actually PAINTED — double rAF so paint N is on screen before we lift it.
	// The lazy app loads behind the splash; the splash then plays its timeline
	// and dismisses to reveal the app.
	useEffect(() => {
		if (!Capacitor.isNativePlatform()) return;
		let raf2 = 0;
		const raf1 = requestAnimationFrame(() => {
			raf2 = requestAnimationFrame(() => {
				void NativeSplash.hide({ fadeOutDuration: 300 });
			});
		});
		return () => {
			cancelAnimationFrame(raf1);
			cancelAnimationFrame(raf2);
		};
	}, []);

	return (
		<>
			<Suspense fallback={null}>
				<App />
			</Suspense>
			{/* Splash overlays everything (fixed, top z-index) while the app loads,
			    then fades/scales out on its own timeline. */}
			<SplashScreen
				visible={splash.visible}
				reducedMotion={splash.reducedMotion}
				onDismiss={splash.dismiss}
			/>
		</>
	);
}

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
	<StrictMode>
		<Root />
	</StrictMode>,
);
