import { IonApp, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { useEffect } from "react";

import { TabsShell } from "@/components/layout/TabsShell";
import { LoginGateProvider } from "@/lib/auth/login-gate";
import { ensureLocationInitialized } from "@/lib/geo/location-store";

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
	// Bootstrap the selected city once (device location → nearest verified city,
	// else the default). Idempotent — no-op when a city is already stored.
	useEffect(() => {
		void ensureLocationInitialized();
	}, []);

	return (
		<IonApp>
			<IonReactRouter>
				<LoginGateProvider>
					<TabsShell />
				</LoginGateProvider>
			</IonReactRouter>
		</IonApp>
	);
};

export default App;
