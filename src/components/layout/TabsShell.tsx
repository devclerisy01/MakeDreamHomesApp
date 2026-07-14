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
import { Redirect, Route, useLocation } from "react-router-dom";

import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/lib/auth/session";
import Home from "@/pages/Home";
import Leads from "@/pages/Leads";
import Login from "@/pages/Login";
import ProfessionalDetail from "@/pages/ProfessionalDetail";
import Professionals from "@/pages/Professionals";
import Profile from "@/pages/Profile";
import Requirement from "@/pages/Requirement";
import Saved from "@/pages/Saved";
import Signup from "@/pages/Signup";

/**
 * App shell: five tabs plus the full-screen auth route. The tab bar is hidden
 * on `/login` (via a location-aware class) so the login screen fills the
 * viewport — matching the design — while every other route keeps the tab bar.
 * Rendered inside `IonReactRouter`, so `useLocation` is available here.
 */
export function TabsShell() {
	const { pathname } = useLocation();
	const { isAuthed } = useAuth();
	const hideTabBar = pathname === ROUTES.login || pathname === ROUTES.register;

	return (
		<IonTabs>
			<IonRouterOutlet>
				<Route exact path="/login">
					<Login />
				</Route>
				<Route exact path="/register">
					<Signup />
				</Route>
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
				<Route exact path="/saved">
					<Saved />
				</Route>
				<Route exact path="/">
					<Redirect to="/home" />
				</Route>
			</IonRouterOutlet>

			<IonTabBar
				slot="bottom"
				className={
					hideTabBar ? "mdh-tab-bar mdh-tab-bar--hidden" : "mdh-tab-bar"
				}
			>
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
					<IonTabButton tab="login" href="/login">
						<IonIcon icon={logInOutline} />
						<IonLabel>Login</IonLabel>
					</IonTabButton>
				)}
			</IonTabBar>
		</IonTabs>
	);
}
