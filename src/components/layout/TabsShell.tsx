import {
	IonIcon,
	IonLabel,
	IonRouterOutlet,
	IonTabBar,
	IonTabButton,
	IonTabs,
} from "@ionic/react";
import { Redirect, Route } from "react-router-dom";

import { Avatar } from "@/components/common/Avatar";
import { ICONS } from "@/theme/icons";

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
	const { isAuthed, user } = useAuth();
	const { openLogin } = useLogin();

	const profileName =
		[user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
		user?.businessName?.trim() ||
		"Profile";
	// Footer tab label: the user's first name once signed in, else "Profile".
	const profileLabel = user?.firstName?.trim() || "Profile";

	return (
		<IonTabs>
			<IonRouterOutlet id="main-content">
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
					<IonIcon icon={ICONS.tabHome} />
					<IonLabel>Home</IonLabel>
				</IonTabButton>
				<IonTabButton tab="leads" href="/leads">
					<IonIcon icon={ICONS.tabLeads} />
					<IonLabel>Leads</IonLabel>
				</IonTabButton>
				<IonTabButton tab="requirement" href="/requirement">
					<IonIcon icon={ICONS.tabRequirement} />
					<IonLabel>Requirement</IonLabel>
				</IonTabButton>
				<IonTabButton tab="professionals" href="/professionals">
					<IonIcon icon={ICONS.tabProfessionals} />
					<IonLabel>Professionals</IonLabel>
				</IonTabButton>
				{isAuthed ? (
					<IonTabButton tab="profile" href="/profile">
						{user?.profilePhoto ? (
							<Avatar
								name={profileName}
								image={user.profilePhoto}
								size={24}
								className="!rounded-full"
							/>
						) : (
							<IonIcon icon={ICONS.tabProfile} />
						)}
						<IonLabel className="truncate">{profileLabel}</IonLabel>
					</IonTabButton>
				) : (
					<IonTabButton
						tab="login"
						onClick={() => openLogin()}
						// No `href`: sign-in is an in-place popup, not a route.
					>
						<IonIcon icon={ICONS.tabLogin} />
						<IonLabel>Login</IonLabel>
					</IonTabButton>
				)}
			</IonTabBar>
		</IonTabs>
	);
}
