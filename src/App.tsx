import { IonApp, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { useEffect } from "react";

import { IntlProvider } from "@/components/providers/IntlProvider";
import { TabsShell } from "@/components/layout/TabsShell";
import { me } from "@/lib/api/auth";
import { LoginGateProvider } from "@/lib/auth/login-gate";
import { getAccessToken, setStoredUser } from "@/lib/auth/session";
import { ensureLocationInitialized } from "@/lib/geo/location-store";

// This module is lazy-loaded from main.tsx (behind the splash), and the
// fonts + theme CSS + the splash live in main.tsx so they load eagerly. Keep
// heavy, app-only concerns here so they don't block the splash from painting.

setupIonicReact({ mode: "md" });

const App: React.FC = () => {
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

	return (
		<IntlProvider>
			<IonApp>
				<IonReactRouter>
					<LoginGateProvider>
						<TabsShell />
					</LoginGateProvider>
				</IonReactRouter>
			</IonApp>
		</IntlProvider>
	);
};

export default App;
