import {
	IonIcon,
	IonLabel,
	IonRouterOutlet,
	IonTabBar,
	IonTabButton,
	IonTabs,
} from "@ionic/react";
import {
	addCircleOutline,
	constructOutline,
	documentTextOutline,
	homeOutline,
	logInOutline,
	personCircleOutline,
} from "ionicons/icons";
import { Redirect, Route } from "react-router-dom";

import { useLogin } from "@/lib/auth/login-gate";
import { useAuth } from "@/lib/auth/session";
import Home from "@/pages/Home";
import Leads from "@/pages/Leads";
import ProfessionalDetail from "@/pages/ProfessionalDetail";
import Professionals from "@/pages/Professionals";
import Profile from "@/pages/Profile";
import Requirement from "@/pages/Requirement";

/**
 * App shell: five tabs over the routed pages. Sign-in and sign-up are both
 * in-place popups (the "Login" tab → `openLogin`; the popups swap between each
 * other), so there are no auth routes.
 */
export function TabsShell() {
	const { isAuthed } = useAuth();
	const { openLogin } = useLogin();

	return (
		<IonTabs>
			<IonRouterOutlet>
				<Route exact path="/home">
					<Home />
				</Route>
				<Route exact path="/leads">
					<Leads />
				</Route>
				<Route exact path="/requirement">
					<Requirement />
				</Route>
				<Route exact path="/professionals">
					<Professionals />
				</Route>
				<Route exact path="/professionals/:slug">
					<ProfessionalDetail />
				</Route>
				<Route exact path="/profile">
					<Profile />
				</Route>
				<Route exact path="/">
					<Redirect to="/home" />
				</Route>
			</IonRouterOutlet>

			<IonTabBar slot="bottom" className="mdh-tab-bar">
				<IonTabButton tab="home" href="/home">
					<IonIcon icon={homeOutline} />
					<IonLabel>Home</IonLabel>
				</IonTabButton>
				<IonTabButton tab="leads" href="/leads">
					<IonIcon icon={documentTextOutline} />
					<IonLabel>Leads</IonLabel>
				</IonTabButton>
				<IonTabButton tab="requirement" href="/requirement">
					<IonIcon icon={addCircleOutline} />
					<IonLabel>Requirement</IonLabel>
				</IonTabButton>
				<IonTabButton tab="professionals" href="/professionals">
					<IonIcon icon={constructOutline} />
					<IonLabel>Professionals</IonLabel>
				</IonTabButton>
				{isAuthed ? (
					<IonTabButton tab="profile" href="/profile">
						<IonIcon icon={personCircleOutline} />
						<IonLabel>Profile</IonLabel>
					</IonTabButton>
				) : (
					<IonTabButton
						tab="login"
						onClick={() => openLogin()}
						// No `href`: sign-in is an in-place popup, not a route.
					>
						<IonIcon icon={logInOutline} />
						<IonLabel>Login</IonLabel>
					</IonTabButton>
				)}
			</IonTabBar>
		</IonTabs>
	);
}
