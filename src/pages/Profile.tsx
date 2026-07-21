import {
	IonContent,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	useIonAlert,
	useIonRouter,
} from "@ionic/react";
import {
	addOutline,
	locationOutline,
	mailOutline,
	personCircleOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";

import { RatingBreakdown } from "@/components/cards/RatingBreakdown";
import { ReviewsList } from "@/components/cards/ReviewsList";
import { ConversationList } from "@/components/chat/ConversationList";
import { Avatar } from "@/components/common/Avatar";
import { Lightbox, type LightboxImage } from "@/components/common/Lightbox";
import { ReadMoreText } from "@/components/common/ReadMoreText";
import {
	PortfolioGridSkeleton,
	SkeletonList,
} from "@/components/common/Skeletons";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { AddPortfolioModal } from "@/components/profile/AddPortfolioModal";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { MyLeadCard } from "@/components/profile/MyLeadCard";
import { PortfolioTile } from "@/components/profile/PortfolioTile";
import { SavedList } from "@/components/profile/SavedList";
import { UI_MESSAGES } from "@/constants/messages";
import {
	encodeProfessionalId,
	publicProfileUrl,
	ROUTES,
} from "@/constants/routes";
import { me } from "@/lib/api/auth";
import { getUnreadTotal } from "@/lib/api/chat";
import { getMyLeads } from "@/lib/api/leads";
import {
	deletePortfolio,
	getMyPortfolio,
	type PortfolioEntry,
} from "@/lib/api/portfolio";
import { getProfessionalDetail } from "@/lib/api/professionals";
import { toastInfo } from "@/lib/api/toast";
import { useLogin } from "@/lib/auth/login-gate";
import { clearSession, setStoredUser, useAuth } from "@/lib/auth/session";
import { getImageSrc } from "@/lib/format";
import { shareLink } from "@/lib/share";
import { SECTION_HEAD, SECTION_TITLE, TAG } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type { Lead, ProfessionalDetail } from "@/types";

type Tab = "messages" | "overview" | "savedPros" | "savedLeads";

/** Neutral profession chip on the identity card (Figma: grey fill, hairline border). */
const PRO_TAG = `${TAG} border-line bg-[#F2F4F7] font-semibold text-ink`;
/** Rounded grey square that frames each identity meta icon (location / email). */
const META_ICON_BOX =
	"flex size-[26px] shrink-0 items-center justify-center rounded-[6px] bg-[#F2F4F7]";

const TABS: { id: Tab; label: string; icon: string }[] = [
	{ id: "overview", label: "Overview", icon: ICONS.tabOverview },
	{ id: "savedPros", label: "Saved Professionals", icon: ICONS.tabSaved },
	{ id: "savedLeads", label: "Saved Leads", icon: ICONS.tabSaved },
	{ id: "messages", label: "Messages", icon: ICONS.message },
];

const filled = (value: string | null | undefined) => Boolean(value?.trim?.());

/** Circular profile-completion indicator (SVG ring + centered percent). */
function CompletionRing({ percent }: { percent: number }) {
	const radius = 26;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference * (1 - percent / 100);
	return (
		<svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0">
			<circle
				cx="32"
				cy="32"
				r={radius}
				fill="none"
				stroke="rgba(255,255,255,0.25)"
				strokeWidth="6"
			/>
			<circle
				cx="32"
				cy="32"
				r={radius}
				fill="none"
				stroke="#fb7185"
				strokeWidth="6"
				strokeLinecap="round"
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				transform="rotate(-90 32 32)"
			/>
			<text
				x="32"
				y="32"
				textAnchor="middle"
				dominantBaseline="central"
				className="fill-white text-[15px] font-extrabold"
			>
				{percent}%
			</text>
		</svg>
	);
}

export default function Profile() {
	const router = useIonRouter();
	const [presentAlert] = useIonAlert();
	const { isAuthed, user } = useAuth();
	const { openLogin } = useLogin();

	const [tab, setTab] = useState<Tab>("overview");
	const [detail, setDetail] = useState<ProfessionalDetail | null>(null);
	const [myLeads, setMyLeads] = useState<Lead[] | null>(null);
	const [myPortfolio, setMyPortfolio] = useState<PortfolioEntry[] | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [editOpen, setEditOpen] = useState(false);
	const [addPortfolioOpen, setAddPortfolioOpen] = useState(false);
	// The portfolio entry being edited (null = the sheet is in "add" mode).
	const [editEntry, setEditEntry] = useState<PortfolioEntry | null>(null);
	// Total unread chat messages (drives the Messages row badge).
	const [unread, setUnread] = useState(0);
	// Fullscreen image viewer, shared by the avatar and the portfolio grid.
	const [lightbox, setLightbox] = useState<{
		images: LightboxImage[];
		index: number;
	} | null>(null);

	/** Confirm, then soft-delete a portfolio entry (removed from the list). */
	function confirmDeletePortfolio(id: string) {
		void presentAlert({
			header: "Delete project?",
			message: "This removes the project from your portfolio.",
			buttons: [
				{ text: "Cancel", role: "cancel" },
				{
					text: "Delete",
					role: "destructive",
					handler: () => {
						// Success/error toast centrally (portfolio.deleted).
						deletePortfolio(id)
							.then(() =>
								setMyPortfolio((prev) =>
									(prev ?? []).filter((p) => p.id !== id),
								),
							)
							.catch(() => {});
					},
				},
			],
		});
	}

	/** Confirm, then sign out — clears the session and returns Home. */
	function confirmLogout() {
		void presentAlert({
			header: "Log out?",
			message: "You'll need to sign in again to post or save.",
			buttons: [
				{ text: "Cancel", role: "cancel" },
				{
					text: "Log out",
					role: "destructive",
					handler: () => {
						clearSession();
						router.push(ROUTES.home, "root", "replace");
					},
				},
			],
		});
	}

	const userId = user?.id;
	const load = useCallback(
		(signal: AbortSignal) => {
			if (!userId) return;
			me()
				.then(setStoredUser)
				.catch(() => {});
			getProfessionalDetail(encodeProfessionalId(String(userId)), signal)
				.then((data) => {
					if (!signal.aborted) setDetail(data);
				})
				.catch(() => {});
			getMyLeads({ limit: 20 }, signal)
				.then((res) => {
					if (!signal.aborted) setMyLeads(res.items);
				})
				.catch(() => {
					if (!signal.aborted) setMyLeads([]);
				});
			// The owner's own portfolio — all statuses (pending items show, badged),
			// matching the web profile.
			getMyPortfolio(signal)
				.then((items) => {
					if (!signal.aborted) {
						setMyPortfolio(items.filter((item) => item.status !== "DELETED"));
					}
				})
				.catch(() => {
					if (!signal.aborted) setMyPortfolio([]);
				});
		},
		[userId],
	);

	useEffect(() => {
		if (!isAuthed) return;
		const controller = new AbortController();
		load(controller.signal);
		return () => controller.abort();
	}, [isAuthed, load, reloadKey]);

	// Keep the Messages unread badge current while the profile is open.
	useEffect(() => {
		if (!isAuthed) {
			setUnread(0);
			return;
		}
		const refresh = () => {
			if (!document.hidden)
				getUnreadTotal()
					.then(setUnread)
					.catch(() => {});
		};
		refresh();
		const timer = setInterval(refresh, 15_000);
		return () => clearInterval(timer);
	}, [isAuthed, reloadKey]);

	if (!isAuthed || !user) {
		return (
			<IonPage>
				<AppHeader title="Profile" tinted />
				<IonContent>
					<Container>
						<div className="mt-6 flex flex-col items-center px-6 py-10 text-center">
							<span className="grid h-20 w-20 place-items-center rounded-full bg-primary-light text-primary">
								<IonIcon icon={personCircleOutline} className="text-5xl" />
							</span>
							<h2 className="mt-4 text-lg font-extrabold text-ink">
								You&apos;re not signed in
							</h2>
							<p className="mt-1.5 max-w-[300px] text-sm text-muted-light">
								Sign in to manage your profile, portfolio, leads and saved
								items.
							</p>
							<button
								type="button"
								onClick={() => openLogin()}
								className="mt-6 w-full max-w-[320px] rounded-xl bg-primary py-3.5 text-[15px] font-bold text-white active:opacity-90"
							>
								Sign in
							</button>
						</div>
					</Container>
				</IonContent>
			</IonPage>
		);
	}

	// Display data, straight from the API (the profile is fully dynamic — sample
	// content lives in the DB on the demo account, not here).
	const fullName = [user.firstName, user.lastName]
		.filter(Boolean)
		.join(" ")
		.trim();
	const business = user.businessName?.trim() || fullName;
	const title = business || "Your Profile";
	const owner = fullName;
	const showOwner = Boolean(owner) && owner !== business;
	const profession = detail?.profession?.trim() ?? "";
	// Only business users (professional/supplier/dealer) have a public web
	// profile page — persons don't, so the share affordance is hidden for them.
	const canShare = ["professional", "supplier", "dealer"].includes(
		user.userType ?? "",
	);

	/** Share this profile's public WEB link via the native share sheet. */
	function shareProfile() {
		void shareLink(
			publicProfileUrl({
				id: String(user?.id),
				userType: user?.userType,
				category: detail?.category,
				profession,
				name: title,
			}),
			title,
		);
	}

	const location = [user.locality, user.city].filter(Boolean).join(", ");
	const about =
		user.about?.trim() || (detail?.about?.join("\n\n").trim() ?? "");
	const photo = user.profilePhoto ?? undefined;
	// Own portfolio (incl. pending) once loaded; fall back to the public detail's
	// approved items until then.
	const portfolio =
		myPortfolio?.map((entry) => ({
			id: entry.id,
			title: entry.title,
			city: [entry.locality, entry.city].filter(Boolean).join(", "),
			image: entry.coverImage ?? undefined,
			pending: entry.status === "PENDING",
		})) ??
		(detail?.portfolio ?? []).map((item) => ({ ...item, pending: false }));
	// Portfolio slides for the fullscreen lightbox (P14).
	const portfolioImages: LightboxImage[] = portfolio.map((item) => ({
		src: getImageSrc(item),
		title: item.title ?? undefined,
		subtitle: item.city || undefined,
	}));
	const leads = myLeads ?? [];
	const hasReviews = Boolean(detail?.reviewsBreakdown && detail.reviewsCount);

	// Profile-completion checklist → percentage (from the real user's fields).
	const isBusiness = user.userType !== "person";
	const businessDone =
		filled(user.businessName) &&
		(user.userType === "professional"
			? Boolean(user.professionalUserType)
			: user.userType === "supplier"
				? (user.supplierProductIds?.length ?? 0) > 0
				: true);
	const steps: boolean[] = [
		filled(user.firstName) && filled(user.lastName) && filled(user.gender),
		filled(user.profilePhoto),
		filled(user.address) &&
			filled(user.locality) &&
			filled(user.city) &&
			filled(user.state) &&
			filled(user.pincode),
		leads.length > 0,
	];
	if (isBusiness) {
		steps.push(businessDone);
		// Portfolio step shows for every business type (not just professionals).
		steps.push(portfolio.length > 0);
	}
	const percent = Math.round(
		(steps.filter(Boolean).length / steps.length) * 100,
	);

	const comingSoon = (what: string) => toastInfo(UI_MESSAGES.comingSoon(what));

	const iconBtn =
		"grid h-5 w-5 place-items-center rounded-full border border-line bg-white text-muted-light active:bg-surface-muted";
	const addBtn =
		"grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-primary active:bg-surface-muted";
	const emptyBox =
		"m-0 rounded-2xl border border-dashed border-line bg-surface-muted px-4 py-6 text-center text-[13px] text-muted-light";

	return (
		<IonPage>
			<AppHeader title={title} tinted />
			<IonContent style={{ "--background": "#ffffff" } as React.CSSProperties}>
				<IonRefresher
					slot="fixed"
					onIonRefresh={(event) => {
						setReloadKey((k) => k + 1);
						event.detail.complete();
					}}
				>
					<IonRefresherContent />
				</IonRefresher>

				<div className="relative">
					{/* Light-blue gradient backdrop behind the tabs (matches other pages). */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-[#e8f3fc] to-white"
					/>
					<div className="relative z-10">
						<Container>
							<div className="-mx-4 flex items-end gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
								{TABS.map((item) => {
									const active = item.id === tab;
									return (
										<button
											key={item.id}
											type="button"
											onClick={() => setTab(item.id)}
											className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-5 py-3.5 text-[12px] font-semibold transition-colors rounded-tl-[20px] rounded-tr-[20px] ${
												active ? "mdh-tab-active text-ink" : "text-muted-light"
											}`}
										>
											<IonIcon icon={item.icon} className="text-base" />
											{item.label}
											{item.id === "messages" && unread > 0 ? (
												<span className="grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
													{unread > 99 ? "99+" : unread}
												</span>
											) : null}
										</button>
									);
								})}
							</div>

							{tab === "messages" ? (
								<div className="-mx-4 bg-white px-4">
									<ConversationList reloadKey={reloadKey} />
								</div>
							) : tab === "savedPros" ? (
								// Distinct keys force a fresh mount per entity — otherwise the
								// reused instance briefly renders the previous tab's items with the
								// wrong card (e.g. a Lead as a ProfessionalCard) and crashes.
								<SavedList key="saved-users" entity="users" />
							) : tab === "savedLeads" ? (
								<SavedList key="saved-leads" entity="leads" />
							) : (
								<div className="flex flex-col gap-4 -mx-4 px-4 bg-white pt-4">
									{/* ---- Identity ---- */}
									<section>
										<div className="flex gap-3.5">
											<button
												type="button"
												disabled={!photo}
												onClick={() =>
													photo &&
													setLightbox({
														images: [{ src: getImageSrc(photo), title }],
														index: 0,
													})
												}
												className="self-start rounded-2xl"
												aria-label="View profile photo"
											>
												<Avatar
													name={title}
													image={photo}
													size={118}
													className="rounded-2xl"
												/>
											</button>
											<div className="min-w-0 flex-1">
												<div className="flex items-start justify-between gap-2">
													{profession ? (
														<span className={PRO_TAG}>{profession}</span>
													) : (
														<span />
													)}
													<div className="flex shrink-0 gap-1.5">
														{canShare ? (
															<button
																type="button"
																aria-label="Share profile"
																className={iconBtn}
																onClick={shareProfile}
															>
																<IonIcon
																	icon={ICONS.share}
																	className="text-[11px]"
																/>
															</button>
														) : null}
														<button
															type="button"
															aria-label="Edit profile"
															className={iconBtn}
															onClick={() => setEditOpen(true)}
														>
															<IonIcon
																icon={ICONS.edit}
																className="text-[11px]"
															/>
														</button>
													</div>
												</div>
												<h2 className="mt-1.5 text-sm font-bold leading-tight text-ink">
													{title}
												</h2>
												{showOwner ? (
													<p className="m-0 text-[10px] text-muted-light">
														By{" "}
														<span className="font-semibold text-ink">
															{owner}
														</span>
													</p>
												) : null}

												{location ? (
													<div className="mt-2 flex items-center gap-2 leading-none">
														<span className={META_ICON_BOX}>
															<IonIcon
																icon={locationOutline}
																className="text-[12px] text-muted-light"
															/>
														</span>
														<div className="min-w-0">
															<span className="block text-[10px] font-medium text-muted-light">
																Location
															</span>
															<span className="text-[12px] font-semibold text-ink">
																{location}
															</span>
														</div>
													</div>
												) : null}
												{user.email ? (
													<div className="mt-2 flex items-center gap-2 leading-none">
														<span className={META_ICON_BOX}>
															<IonIcon
																icon={mailOutline}
																className="text-[15px] text-muted-light"
															/>
														</span>
														<div className="min-w-0">
															<span className="block text-[11px] font-medium text-muted-light">
																Email
															</span>
															<span className="block truncate text-[13.5px] font-bold text-ink">
																{user.email}
															</span>
														</div>
													</div>
												) : null}
											</div>
										</div>

										{about ? (
											<div className="mt-3">
												<span className="mb-0.5 block text-xs font-bold text-ink">
													About
												</span>
												<ReadMoreText
													text={about}
													lines={4}
													title="About"
													className="m-0 text-[11px] font-medium leading text-muted"
												/>
											</div>
										) : null}
									</section>

									{/* ---- Completion ---- */}
									{percent < 100 ? (
										<section className="flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1220] via-[#1c3259] to-primary p-4 text-white">
											<div className="min-w-0">
												<h3 className="m-0 text-base font-extrabold">
													Complete Your Profile
												</h3>
												<p className="mt-1 text-xs leading-snug text-white/70">
													Add the missing details to build trust and get more
													leads.
												</p>
											</div>
											<CompletionRing percent={percent} />
										</section>
									) : null}

									{/* ---- Portfolio ---- */}
									<section>
										<div className={SECTION_HEAD}>
											<h2 className={SECTION_TITLE}>Portfolio</h2>
											<button
												type="button"
												aria-label="Add portfolio item"
												className={addBtn}
												onClick={() => setAddPortfolioOpen(true)}
											>
												<IonIcon icon={addOutline} className="text-lg" />
											</button>
										</div>
										{myPortfolio === null ? (
											<PortfolioGridSkeleton
												count={4}
												className="grid grid-cols-2 gap-3.5"
											/>
										) : portfolio.length ? (
											<div className="grid grid-cols-2 gap-3.5">
												{portfolio.map((item, i) => (
													<PortfolioTile
														key={item.id}
														item={item}
														pending={item.pending}
														onOpen={() =>
															setLightbox({ images: portfolioImages, index: i })
														}
														onEdit={
															myPortfolio
																? () => {
																		const full = myPortfolio.find(
																			(p) => p.id === item.id,
																		);
																		if (full) setEditEntry(full);
																	}
																: undefined
														}
														onDelete={
															myPortfolio
																? () => confirmDeletePortfolio(item.id)
																: undefined
														}
													/>
												))}
											</div>
										) : (
											<p className={emptyBox}>
												No portfolio yet. Add your projects to showcase your
												work.
											</p>
										)}
									</section>

									{/* ---- My Leads ---- */}
									<section>
										<div className={SECTION_HEAD}>
											<h2 className={SECTION_TITLE}>My Leads</h2>
											<button
												type="button"
												aria-label="Post a requirement"
												className={addBtn}
												onClick={() => router.push(ROUTES.requirement)}
											>
												<IonIcon icon={addOutline} className="text-lg" />
											</button>
										</div>
										{myLeads === null ? (
											<SkeletonList count={3} variant="lead" />
										) : leads.length ? (
											<div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
												{leads.map((lead) => (
													<MyLeadCard
														key={lead.id}
														lead={lead}
														onEdit={() => comingSoon("Editing requirements")}
													/>
												))}
											</div>
										) : (
											<p className={emptyBox}>
												You haven&apos;t posted any requirements yet.
											</p>
										)}
									</section>

									{/* ---- Rating & Reviews ---- */}
									{hasReviews && detail ? (
										<div className="flex flex-col gap-4">
											{detail.reviewsBreakdown ? (
												<RatingBreakdown
													breakdown={detail.reviewsBreakdown}
													count={detail.reviewsCount}
												/>
											) : null}
											<ReviewsList
												userId={detail.id}
												initialReviews={detail.reviews ?? []}
												total={detail.reviewsCount ?? 0}
											/>
										</div>
									) : null}

									{/* ---- Account ---- */}
									<section className="pb-2">
										<button
											type="button"
											onClick={confirmLogout}
											className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-line bg-white py-3 text-[13px] font-bold text-danger active:bg-surface-muted"
										>
											<IonIcon icon={ICONS.logout} className="text-[16px]" />
											Log out
										</button>
									</section>
								</div>
							)}
						</Container>
					</div>
				</div>

				<EditProfileModal
					user={user}
					isOpen={editOpen}
					onClose={() => setEditOpen(false)}
					onSaved={() => setReloadKey((k) => k + 1)}
				/>

				<AddPortfolioModal
					isOpen={addPortfolioOpen || editEntry !== null}
					entry={editEntry}
					onClose={() => {
						setAddPortfolioOpen(false);
						setEditEntry(null);
					}}
					onSaved={(saved) => {
						// Upsert: replace the edited entry, or prepend a new one.
						setMyPortfolio((prev) => {
							const list = prev ?? [];
							return list.some((p) => p.id === saved.id)
								? list.map((p) => (p.id === saved.id ? saved : p))
								: [saved, ...list];
						});
						setTab("overview");
					}}
				/>

				{lightbox ? (
					<Lightbox
						images={lightbox.images}
						index={lightbox.index}
						onIndexChange={(i) =>
							setLightbox((lb) => (lb ? { ...lb, index: i } : lb))
						}
						onClose={() => setLightbox(null)}
					/>
				) : null}
			</IonContent>
		</IonPage>
	);
}
