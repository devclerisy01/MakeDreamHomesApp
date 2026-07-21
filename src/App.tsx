import { Capacitor } from "@capacitor/core";
import { SplashScreen as NativeSplash } from "@capacitor/splash-screen";
import { IonApp, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { useEffect } from "react";

import { TabsShell } from "@/components/layout/TabsShell";
import { SplashScreen } from "@/components/splash/SplashScreen";
import { me } from "@/lib/api/auth";
import { LoginGateProvider } from "@/lib/auth/login-gate";
import { getAccessToken, setStoredUser } from "@/lib/auth/session";
import { ensureLocationInitialized } from "@/lib/geo/location-store";
import { useSplash } from "@/hooks/useSplash";

/* Self-hosted Plus Jakarta Sans (weights the app uses: 400/500/600/700/800).
   Bundled by Vite so it works offline in the Capacitor WebView — no CDN. */
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";

/* Tailwind first: it declares the cascade-layer order (incl. `ionic`). */
import "@/theme/tailwind.css";

/* Ionic global styles, scoped into the low-priority `ionic` layer. */
import "@/theme/ionic.css";

/* Theme (light-only, matches the designs) + Ionic-specific tweaks (unlayered). */
import "@/theme/variables.css";
import "@/theme/app.css";

setupIonicReact({ mode: "md" });

const App: React.FC = () => {
	// Animated web splash — shown once per session over the live homepage,
	// then fades/scales out. Reduced-motion + session-skip handled in the hook.
	const splash = useSplash();

	// Bootstrap the selected city once (device location → nearest verified city,
	// else the default). Idempotent — no-op when a city is already stored.
	useEffect(() => {
		void ensureLocationInitialized();
	}, []);

	// Validate a persisted session on boot: refresh the cached user from `/me`.
	// An expired/invalid session is cleared (and the user notified) centrally by
	// the API client's refresh path; a network error leaves the session intact.
	useEffect(() => {
		if (!getAccessToken()) return;
		me()
			.then(setStoredUser)
			.catch(() => {
				/* handled centrally (401 → forced logout; network error → kept) */
			});
	}, []);

	// The native splash is held open (launchAutoHide: false) until here, so the
	// user sees the branded splash instead of a blank WebView while JS boots.
	// Hide it only after the browser has actually PAINTED the first content frame
	// — a single rAF fires before that paint, so we chain a second rAF (paint N
	// is on screen by the time it runs). Hiding on the first rAF lifts the splash
	// a frame too early and flashes the empty WebView; the double rAF is what
	// makes the hand-off seamless. Fade over 300ms for a soft cross-dissolve.
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
		<IonApp>
			<IonReactRouter>
				<LoginGateProvider>
					<TabsShell />
				</LoginGateProvider>
			</IonReactRouter>
			{/* Animated splash overlays the app, then fades into the homepage. */}
			<SplashScreen
				visible={splash.visible}
				reducedMotion={splash.reducedMotion}
				onDismiss={splash.dismiss}
			/>
		</IonApp>
	);
};

export default App;
