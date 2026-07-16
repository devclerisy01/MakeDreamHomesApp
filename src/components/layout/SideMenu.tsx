import {
	IonContent,
	IonIcon,
	IonMenu,
	IonMenuToggle,
	useIonRouter,
} from "@ionic/react";

import { Avatar } from "@/components/common/Avatar";
import { ROUTES } from "@/constants/routes";
import { useLogin } from "@/lib/auth/login-gate";
import { clearSession, useAuth } from "@/lib/auth/session";
import { ICONS } from "@/theme/icons";

const NAV_ITEMS = [
	{ label: "Home", href: ROUTES.home, icon: ICONS.tabHome },
	{ label: "Latest Leads", href: ROUTES.leads, icon: ICONS.tabLeads },
	{
		label: "Post Requirement",
		href: ROUTES.requirement,
		icon: ICONS.tabRequirement,
	},
	{
		label: "Find Professionals",
		href: ROUTES.professionals,
		icon: ICONS.tabProfessionals,
	},
] as const;

/**
 * App side drawer (slides in from the start edge), opened by the header's
 * "three bars" button. A branded header, quick navigation, and the account
 * action (Sign out when signed in, Sign up when signed out). `IonMenuToggle`
 * closes the drawer on selection.
 */
export function SideMenu() {
	const router = useIonRouter();
	const { isAuthed, user } = useAuth();
	const { openSignup } = useLogin();

	function go(href: string) {
		router.push(href, "root", "replace");
	}

	function signOut() {
		clearSession();
		router.push(ROUTES.home, "root", "replace");
	}

	const fullName =
		[user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
		user?.businessName?.trim() ||
		"Welcome";

	return (
		<IonMenu menuId="app-menu" contentId="main-content" side="start">
			<IonContent style={{ "--background": "#ffffff" } as React.CSSProperties}>
				<div className="flex min-h-full flex-col">
					{/* ── Brand / user header ─────────────────────────────── */}
					<div className="bg-gradient-to-br from-primary to-primary-dark px-5 pb-6 pt-[calc(env(safe-area-inset-top)+22px)] text-white">
						<img
							src="/logo.svg"
							alt="MakeDreamHomes"
							className="mb-5 h-6 w-auto brightness-0 invert"
						/>
						{isAuthed ? (
							<div className="flex items-center gap-3">
								<Avatar
									name={fullName}
									image={user?.profilePhoto ?? undefined}
									size={46}
									className="ring-2 ring-white/40"
								/>
								<div className="min-w-0">
									<p className="m-0 truncate text-[15px] font-bold leading-tight">
										{fullName}
									</p>
									{user?.phone ? (
										<p className="m-0 mt-0.5 truncate text-[12px] text-white/70">
											{user.phone}
										</p>
									) : null}
								</div>
							</div>
						) : (
							<div>
								<p className="m-0 text-[16px] font-bold leading-tight">
									Build your dream home
								</p>
								<p className="m-0 mt-1 text-[12px] leading-snug text-white/75">
									Hire professionals, buy or sell property &amp; source
									material.
								</p>
							</div>
						)}
					</div>

					{/* ── Navigation ──────────────────────────────────────── */}
					<nav className="flex-1 px-3 py-4">
						<p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-light">
							Menu
						</p>
						{NAV_ITEMS.map((item) => (
							<IonMenuToggle key={item.href} autoHide={false}>
								<button
									type="button"
									onClick={() => go(item.href)}
									className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-ink transition-colors active:bg-primary-light"
								>
									<span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
										<IonIcon icon={item.icon} className="text-[18px]" />
									</span>
									<span className="flex-1">{item.label}</span>
									<IonIcon
										icon={ICONS.chevronForward}
										className="text-[15px] text-muted-light"
									/>
								</button>
							</IonMenuToggle>
						))}

						{isAuthed ? (
							<IonMenuToggle autoHide={false}>
								<button
									type="button"
									onClick={() => go(ROUTES.profile)}
									className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-ink transition-colors active:bg-primary-light"
								>
									<span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
										<IonIcon icon={ICONS.tabProfile} className="text-[18px]" />
									</span>
									<span className="flex-1">My Profile</span>
									<IonIcon
										icon={ICONS.chevronForward}
										className="text-[15px] text-muted-light"
									/>
								</button>
							</IonMenuToggle>
						) : null}
					</nav>

					{/* ── Account action ──────────────────────────────────── */}
					<div className="border-t border-line px-4 py-4">
						<IonMenuToggle autoHide={false}>
							{isAuthed ? (
								<button
									type="button"
									onClick={signOut}
									className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/5 py-3 text-[13px] font-bold text-danger"
								>
									<IonIcon icon={ICONS.logout} className="text-[17px]" />
									Sign out
								</button>
							) : (
								<button
									type="button"
									onClick={() => openSignup()}
									className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13px] font-bold text-white"
								>
									<IonIcon icon={ICONS.tabProfile} className="text-[17px]" />
									Sign up
								</button>
							)}
						</IonMenuToggle>
						<p className="m-0 mt-3 text-center text-[10px] text-muted-light">
							MakeDreamHomes · v0.0.1
						</p>
					</div>
				</div>
			</IonContent>
		</IonMenu>
	);
}
