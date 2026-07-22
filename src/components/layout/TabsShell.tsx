import {
	IonIcon,
	IonLabel,
	IonPage,
	IonRouterOutlet,
	IonTabBar,
	IonTabButton,
	IonTabs,
	useIonRouter,
} from "@ionic/react";
import { Suspense, lazy } from "react";
import { Redirect, Route } from "react-router-dom";

import { Avatar } from "@/components/common/Avatar";
import { ROUTES } from "@/constants/routes";
import { ICONS } from "@/theme/icons";

import { useLogin } from "@/lib/auth/login-gate";
import { useAuth } from "@/lib/auth/session";

// Pages are lazy-loaded so they are NOT in the initial bundle — only the shell
// (and the current route's chunk) loads at boot, which shrinks the splash-to-app
// wait considerably. Each page brings in its own forms/logic on demand.
const Conversation = lazy(() => import("@/pages/Conversation"));
const Home = lazy(() => import("@/pages/Home"));
const Leads = lazy(() => import("@/pages/Leads"));
const Messages = lazy(() => import("@/pages/Messages"));
const ProfessionalDetail = lazy(() => import("@/pages/ProfessionalDetail"));
const Professionals = lazy(() => import("@/pages/Professionals"));
const Profile = lazy(() => import("@/pages/Profile"));
const Requirement = lazy(() => import("@/pages/Requirement"));

// Fallback shown while a page's chunk loads. An empty IonPage keeps the router
// outlet's transition well-formed; each page renders its own skeleton loader
// once its chunk arrives.
const pageFallback = <IonPage />;

/**
 * App shell: five tabs over the routed pages. Sign-in and sign-up are both
 * in-place popups (the "Login" tab → `openLogin`; the popups swap between each
 * other), so there are no auth routes.
 */
export function TabsShell() {
	const { isAuthed, user } = useAuth();
	const { openLogin } = useLogin();
	const router = useIonRouter();

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
					<Suspense fallback={pageFallback}>
						<Home />
					</Suspense>
				</Route>
				<Route exact path="/leads">
					<Suspense fallback={pageFallback}>
						<Leads />
					</Suspense>
				</Route>
				<Route exact path="/requirement">
					<Suspense fallback={pageFallback}>
						<Requirement />
					</Suspense>
				</Route>
				<Route exact path="/professionals">
					<Suspense fallback={pageFallback}>
						<Professionals />
					</Suspense>
				</Route>
				<Route exact path="/professionals/:slug">
					<Suspense fallback={pageFallback}>
						<ProfessionalDetail />
					</Suspense>
				</Route>
				<Route exact path="/profile">
					<Suspense fallback={pageFallback}>
						<Profile />
					</Suspense>
				</Route>
				<Route exact path="/messages">
					<Suspense fallback={pageFallback}>
						<Messages />
					</Suspense>
				</Route>
				<Route exact path="/messages/:id">
					<Suspense fallback={pageFallback}>
						<Conversation />
					</Suspense>
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
						// A bare nav login (no gated action) lands on the profile once
						// signed in — mirrors the web's nav-login → profile redirect.
						onClick={() =>
							openLogin({
								onAuthenticated: () => router.push(ROUTES.profile, "root"),
							})
						}
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
