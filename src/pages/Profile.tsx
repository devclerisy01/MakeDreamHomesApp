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
	createOutline,
	heartOutline,
	locationOutline,
	personCircleOutline,
	personOutline,
	shareSocialOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";

import { RatingBreakdown } from "@/components/cards/RatingBreakdown";
import { Avatar } from "@/components/common/Avatar";
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
import { encodeProfessionalId, ROUTES } from "@/constants/routes";
import { UI_MESSAGES } from "@/constants/messages";
import { me } from "@/lib/api/auth";
import { getMyLeads } from "@/lib/api/leads";
import {
	deletePortfolio,
	getMyPortfolio,
	type PortfolioEntry,
} from "@/lib/api/portfolio";
import { getProfessionalDetail } from "@/lib/api/professionals";
import { toastInfo } from "@/lib/api/toast";
import { useLogin } from "@/lib/auth/login-gate";
import { setStoredUser, useAuth } from "@/lib/auth/session";
import { CARD, SECTION_HEAD, SECTION_TITLE, TAG_PRIMARY } from "@/lib/ui";
import type { Lead, ProfessionalDetail } from "@/types";

type Tab = "overview" | "savedPros" | "savedLeads";

const TABS: { id: Tab; label: string; icon: string }[] = [
	{ id: "overview", label: "Overview", icon: personOutline },
	{ id: "savedPros", label: "Saved Professionals", icon: heartOutline },
	{ id: "savedLeads", label: "Saved Leads", icon: heartOutline },
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

	if (!isAuthed || !user) {
		return (
			<IonPage>
				<AppHeader title="Profile" />
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
		"grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-muted-light active:bg-surface-muted";
	const addBtn =
		"grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-primary active:bg-surface-muted";
	const emptyBox =
		"m-0 rounded-2xl border border-dashed border-line bg-surface-muted px-4 py-6 text-center text-[13px] text-muted-light";

	return (
		<IonPage>
			<AppHeader title={title} />
			<IonContent>
				<IonRefresher
					slot="fixed"
					onIonRefresh={(event) => {
						setReloadKey((k) => k + 1);
						event.detail.complete();
					}}
				>
					<IonRefresherContent />
				</IonRefresher>

				<Container>
					<div className="flex border-b border-line">
						{TABS.map((item) => {
							const active = item.id === tab;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => setTab(item.id)}
									className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 pb-2.5 pt-1 text-[12px] font-semibold ${
										active
											? "border-primary text-primary"
											: "border-transparent text-muted-light"
									}`}
								>
									<IonIcon icon={item.icon} className="text-base" />
									{item.label}
								</button>
							);
						})}
					</div>

					{tab === "savedPros" ? (
						// Distinct keys force a fresh mount per entity — otherwise the
						// reused instance briefly renders the previous tab's items with the
						// wrong card (e.g. a Lead as a ProfessionalCard) and crashes.
						<SavedList key="saved-users" entity="users" />
					) : tab === "savedLeads" ? (
						<SavedList key="saved-leads" entity="leads" />
					) : (
						<div className="mt-4 flex flex-col gap-4">
							{/* ---- Identity ---- */}
							<section className={`p-4 ${CARD}`}>
								<div className="flex gap-3.5">
									<Avatar
										name={title}
										image={photo}
										size={84}
										className="self-start rounded-2xl"
									/>
									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-2">
											{profession ? (
												<span className={TAG_PRIMARY}>{profession}</span>
											) : (
												<span />
											)}
											<div className="flex shrink-0 gap-1.5">
												<button
													type="button"
													aria-label="Share profile"
													className={iconBtn}
													onClick={() => comingSoon("Sharing")}
												>
													<IonIcon icon={shareSocialOutline} />
												</button>
												<button
													type="button"
													aria-label="Edit profile"
													className={iconBtn}
													onClick={() => setEditOpen(true)}
												>
													<IonIcon icon={createOutline} />
												</button>
											</div>
										</div>
										<h2 className="mt-1.5 text-xl font-extrabold leading-tight text-ink">
											{title}
										</h2>
										{showOwner ? (
											<p className="m-0 text-[13px] text-muted-light">
												By{" "}
												<span className="font-semibold text-ink">{owner}</span>
											</p>
										) : null}

										{location ? (
											<div className="mt-2.5 flex items-start gap-1.5">
												<IonIcon
													icon={locationOutline}
													className="mt-0.5 shrink-0 text-[16px] text-muted-light"
												/>
												<div className="min-w-0">
													<span className="block text-[11px] font-semibold text-muted-light">
														Location
													</span>
													<span className="text-[13.5px] font-semibold text-ink">
														{location}
													</span>
												</div>
											</div>
										) : null}
									</div>
								</div>

								{about ? (
									<div className="mt-3">
										<span className="mb-0.5 block text-xs font-bold text-muted-light">
											About
										</span>
										<ReadMoreText
											text={about}
											lines={4}
											title="About"
											className="m-0 text-[13.5px] leading-relaxed text-muted"
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
											Add the missing details to build trust and get more leads.
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
										{portfolio.map((item) => (
											<PortfolioTile
												key={item.id}
												item={item}
												pending={item.pending}
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
										No portfolio yet. Add your projects to showcase your work.
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
							{hasReviews && detail?.reviewsBreakdown ? (
								<RatingBreakdown
									breakdown={detail.reviewsBreakdown}
									count={detail.reviewsCount}
								/>
							) : null}
						</div>
					)}
				</Container>

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
			</IonContent>
		</IonPage>
	);
}
