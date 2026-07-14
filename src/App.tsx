import { IonApp, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import { TabsShell } from "@/components/layout/TabsShell";

/* Tailwind first: it declares the cascade-layer order (incl. `ionic`). */
import "@/theme/tailwind.css";

/* Ionic global styles, scoped into the low-priority `ionic` layer. */
import "@/theme/ionic.css";

/* Theme (light-only, matches the designs) + Ionic-specific tweaks (unlayered). */
import "@/theme/variables.css";
import "@/theme/app.css";

setupIonicReact({ mode: "md" });

const App: React.FC = () => (
	<IonApp>
		<IonReactRouter>
			<TabsShell />
		</IonReactRouter>
	</IonApp>
);

export default App;
