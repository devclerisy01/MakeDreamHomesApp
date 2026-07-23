import {
	IonContent,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonSpinner,
	useIonAlert,
	useIonRouter,
	useIonViewWillEnter,
} from "@ionic/react";
import {
	addOutline,
	callOutline,
	checkmarkOutline,
	locationOutline,
	mailOutline,
	personCircleOutline,
	trashOutline,
} from "ionicons/icons";
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { RatingBreakdown } from "@/components/cards/RatingBreakdown";
import { ReviewsList } from "@/components/cards/ReviewsList";
import { ConversationList } from "@/components/chat/ConversationList";
import { Avatar } from "@/components/common/Avatar";
import { Lightbox, type LightboxImage } from "@/components/common/Lightbox";
import { ReadMoreText } from "@/components/common/ReadMoreText";
import { PortfolioGridSkeleton } from "@/components/common/Skeletons";
import { Stars } from "@/components/common/Stars";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { AboutModal } from "@/components/profile/AboutModal";
import { AddPortfolioModal } from "@/components/profile/AddPortfolioModal";
import { AddressModal } from "@/components/profile/AddressModal";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ImageCropperModal } from "@/components/profile/ImageCropperModal";
import { MyLeadsPanel } from "@/components/profile/MyLeadsPanel";
import { PortfolioTile } from "@/components/profile/PortfolioTile";
import { SavedList } from "@/components/profile/SavedList";
import { SupplierCatalogSection } from "@/components/profile/SupplierCatalogSection";
import { UI_MESSAGES } from "@/constants/messages";
import {
	encodeProfessionalId,
	publicProfileUrl,
	ROUTES,
} from "@/constants/routes";
import { me, updateProfile, uploadProfileImage } from "@/lib/api/auth";
import { getUnreadTotal } from "@/lib/api/chat";
import {
	deletePortfolio,
	getMyPortfolio,
	type PortfolioEntry,
} from "@/lib/api/portfolio";
import { getProfessionalDetail } from "@/lib/api/professionals";
import { toastError, toastInfo } from "@/lib/api/toast";
import { useLogin } from "@/lib/auth/login-gate";
import { clearSession, setStoredUser, useAuth } from "@/lib/auth/session";
import { getImageSrc } from "@/lib/format";
import { shareLink } from "@/lib/share";
import { SECTION_HEAD, SECTION_TITLE, TAG } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type { ProfessionalDetail } from "@/types";

type Tab = "messages" | "overview" | "myLeads" | "savedPros" | "savedLeads";

/** Neutral profession chip on the identity card (Figma: grey fill, hairline border). */
const PRO_TAG = `${TAG} border-line bg-[#F2F4F7] font-semibold text-ink`;
/** Rounded grey square that frames each identity meta icon (location / email). */
const META_ICON_BOX =
	"flex size-[26px] shrink-0 items-center justify-center rounded-[6px] bg-[#F2F4F7]";

const TABS: { id: Tab; label: string; icon: string }[] = [
	{ id: "overview", label: "My Profile", icon: ICONS.tabOverview },
	{ id: "myLeads", label: "My Leads", icon: ICONS.tabLeads },
	{ id: "savedPros", label: "Saved Professionals", icon: ICONS.tabSaved },
	{ id: "savedLeads", label: "Saved Leads", icon: ICONS.tabSaved },
	{ id: "messages", label: "Messages", icon: ICONS.message },
];

/** Max profile-photo upload size (5 MB), matching the edit-profile sheet. */
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

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

/** Compact prev/next pager (‹ x / y ›). */
function Pager({
	page,
	totalPages,
	onChange,
}: {
	page: number;
	totalPages: number;
	onChange: (page: number) => void;
}) {
	const btn =
		"grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink disabled:opacity-40 active:bg-surface-muted";
	return (
		<div className="mt-4 flex items-center justify-center gap-3">
			<button
				type="button"
				aria-label="Previous page"
				disabled={page <= 1}
				onClick={() => onChange(page - 1)}
				className={btn}
			>
				<IonIcon icon={ICONS.back} className="text-lg" />
			</button>
			<span className="text-[13px] font-semibold text-muted">
				{page} / {totalPages}
			</span>
			<button
				type="button"
				aria-label="Next page"
				disabled={page >= totalPages}
				onClick={() => onChange(page + 1)}
				className={btn}
			>
				<IonIcon icon={ICONS.chevronForward} className="text-lg" />
			</button>
		</div>
	);
}

export default function Profile() {
	const router = useIonRouter();
	const [presentAlert] = useIonAlert();
	const { isAuthed, user } = useAuth();
	const { openLogin } = useLogin();

	const [tab, setTab] = useState<Tab>("overview");
	const [detail, setDetail] = useState<ProfessionalDetail | null>(null);
	const [myPortfolio, setMyPortfolio] = useState<PortfolioEntry[] | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [portfolioPage, setPortfolioPage] = useState(1);
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
	// Hero editors: About (P32) and Address (P7) focused sheets.
	const [aboutOpen, setAboutOpen] = useState(false);
	const [addressOpen, setAddressOpen] = useState(false);
	// Avatar editing (P3/P5/P6): the picked file awaiting crop, and the
	// upload-in-progress flag that shows a spinner over the hero photo.
	const [cropFile, setCropFile] = useState<File | null>(null);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	// Briefly ring the hero photo when the checklist's photo step fires (P34).
	const [highlightPhoto, setHighlightPhoto] = useState(false);
	// Hidden file input for the avatar, the hero photo box (scroll target), and
	// the reviews block (scroll target from the hero rating card, P9/P34).
	const photoInputRef = useRef<HTMLInputElement>(null);
	const heroPhotoRef = useRef<HTMLDivElement>(null);
	const reviewsRef = useRef<HTMLDivElement>(null);

	// Deep-link: land on a specific tab when navigated with ?tab=<id>
	// (e.g. after posting a requirement → My Leads).
	useIonViewWillEnter(() => {
		const requested = new URLSearchParams(window.location.search).get("tab");
		if (requested && TABS.some((item) => item.id === requested)) {
			setTab(requested as Tab);
		}
	});

	/** Confirm, then soft-delete a portfolio entry (removed from the list). */
	function confirmDeletePortfolio(id: string) {
		void presentAlert({
			header: "Delete portfolio item?",
			message: "This removes the item from your portfolio.",
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

	/** Open the OS file picker for a new avatar. */
	function openPhotoPicker() {
		photoInputRef.current?.click();
	}

	/** Checklist "Upload profile picture" step (P34): scroll to the hero photo,
	 *  briefly ring it, and open the picker (the click keeps a user gesture). */
	function highlightPhotoBox() {
		heroPhotoRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
		setHighlightPhoto(true);
		window.setTimeout(() => setHighlightPhoto(false), 2500);
		openPhotoPicker();
	}

	/** Validate a picked image and hand it to the cropper (P3/P6). */
	function onPhotoPick(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toastInfo(UI_MESSAGES.imageOnly);
			return;
		}
		if (file.size > MAX_PHOTO_SIZE) {
			toastInfo(UI_MESSAGES.imageTooLarge);
			return;
		}
		setCropFile(file);
	}

	/** Upload the cropped avatar (presign → key) and persist it (P3/P6). */
	async function onCropped(cropped: File) {
		setCropFile(null);
		setUploadingPhoto(true);
		try {
			const key = await uploadProfileImage(cropped);
			const updated = await updateProfile({ profilePhoto: key });
			setStoredUser(updated);
			setReloadKey((k) => k + 1);
		} catch {
			toastError(UI_MESSAGES.photoUploadFailed);
		} finally {
			setUploadingPhoto(false);
		}
	}

	/** Confirm, then clear the profile photo (P5). */
	function confirmRemovePhoto() {
		void presentAlert({
			header: "Remove photo?",
			message: "Your profile picture will be removed.",
			buttons: [
				{ text: "Cancel", role: "cancel" },
				{
					text: "Remove",
					role: "destructive",
					handler: () => {
						updateProfile({ profilePhoto: "" })
							.then((updated) => {
								setStoredUser(updated);
								setReloadKey((k) => k + 1);
							})
							.catch(() => {});
					},
				},
			],
		});
	}

	/** Smooth-scroll to the Rating & Reviews block (from the hero rating card). */
	function scrollToReviews() {
		reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
			photoCount: entry.media?.length ?? 0,
			pending: entry.status === "PENDING",
		})) ??
		(detail?.portfolio ?? []).map((item) => ({
			...item,
			pending: false,
			photoCount: item.images?.length ?? 0,
		}));
	// Portfolio slides for the fullscreen lightbox (P14).
	const portfolioImages: LightboxImage[] = portfolio.map((item) => ({
		src: getImageSrc(item),
		title: item.title ?? undefined,
		subtitle: item.city || undefined,
	}));
	const hasReviews = Boolean(detail?.reviewsBreakdown && detail.reviewsCount);

	// Portfolio pager (P15) — 4 per page on the 2-col grid.
	const PORTFOLIO_PER_PAGE = 4;
	const portfolioPages = Math.max(
		1,
		Math.ceil(portfolio.length / PORTFOLIO_PER_PAGE),
	);
	const portfolioSafePage = Math.min(portfolioPage, portfolioPages);
	const portfolioOffset = (portfolioSafePage - 1) * PORTFOLIO_PER_PAGE;
	const pagedPortfolio = portfolio.slice(
		portfolioOffset,
		portfolioOffset + PORTFOLIO_PER_PAGE,
	);

	// Profile-completion checklist (P12): each step is actionable — it opens the
	// relevant editor / picker, or routes to post-requirement. Basic, photo,
	// address and requirement apply to everyone; business details show for
	// business accounts; portfolio shows for business types that keep one
	// (professionals/dealers — suppliers use the catalog instead).
	const isBusiness = user.userType !== "person";
	const hasPortfolioSection = isBusiness && user.userType !== "supplier";
	const basicDone =
		filled(user.firstName) && filled(user.lastName) && filled(user.gender);
	const addressDone =
		filled(user.address) &&
		filled(user.locality) &&
		filled(user.city) &&
		filled(user.state) &&
		filled(user.pincode);
	let businessDone = filled(user.businessName);
	if (user.userType === "professional") {
		businessDone = businessDone && Boolean(user.professionalUserType);
	}
	if (user.userType === "supplier") {
		businessDone = businessDone && (user.supplierProductIds?.length ?? 0) > 0;
	}
	// When only the description is missing, the business step opens the About
	// editor directly (rather than the full edit sheet).
	const businessCoreDone = businessDone;
	if (isBusiness) businessDone = businessDone && filled(user.about);

	const steps: { label: string; done: boolean; action: () => void }[] = [
		{
			label: "Add General Details",
			done: basicDone,
			action: () => setEditOpen(true),
		},
		{
			label: "Upload Profile Picture",
			done: filled(user.profilePhoto),
			action: highlightPhotoBox,
		},
		...(isBusiness
			? [
					{
						label: "Add Business Details",
						done: businessDone,
						action: () =>
							businessCoreDone && !filled(user.about)
								? setAboutOpen(true)
								: setEditOpen(true),
					},
				]
			: []),
		{
			label: "Add Address Details",
			done: addressDone,
			action: () => setAddressOpen(true),
		},
		...(hasPortfolioSection
			? [
					{
						label: "Upload Portfolio",
						done: portfolio.length > 0,
						action: () => setAddPortfolioOpen(true),
					},
				]
			: []),
		{
			label: "Post Your First Requirement",
			done: (user.leadCount ?? 0) > 0,
			action: () => router.push(ROUTES.requirement),
		},
	];
	const percent = Math.round(
		(steps.filter((s) => s.done).length / steps.length) * 100,
	);

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
							) : tab === "myLeads" ? (
								<MyLeadsPanel />
							) : (
								<div className="flex flex-col gap-4 -mx-4 px-4 bg-white pt-4">
									{/* ---- Identity ---- */}
									<section>
										<div className="flex gap-3.5">
											<div
												ref={heroPhotoRef}
												className={`relative self-start rounded-2xl transition-shadow ${
													highlightPhoto
														? "ring-2 ring-primary ring-offset-2 ring-offset-white"
														: ""
												}`}
											>
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
													className="block rounded-2xl"
													aria-label="View profile photo"
												>
													<Avatar
														name={title}
														image={photo}
														size={118}
														className="rounded-2xl"
													/>
												</button>

												{uploadingPhoto ? (
													<span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40">
														<IonSpinner
															name="crescent"
															className="h-6 w-6 text-white"
														/>
													</span>
												) : null}

												{/* Change photo (P6) → crop (P3) → upload. */}
												<button
													type="button"
													onClick={openPhotoPicker}
													disabled={uploadingPhoto}
													aria-label="Change profile photo"
													className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-primary text-white disabled:opacity-60"
												>
													<IonIcon icon={ICONS.camera} className="text-base" />
												</button>

												{/* Remove photo (P5) — only when one is set. */}
												{photo && !uploadingPhoto ? (
													<button
														type="button"
														onClick={confirmRemovePhoto}
														aria-label="Remove profile photo"
														className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-white text-danger"
													>
														<IonIcon
															icon={trashOutline}
															className="text-[13px]"
														/>
													</button>
												) : null}

												<input
													ref={photoInputRef}
													type="file"
													accept="image/*"
													className="hidden"
													onChange={onPhotoPick}
												/>
											</div>
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
														<div className="min-w-0 flex-1">
															<span className="block text-[10px] font-medium text-muted-light">
																Location
															</span>
															<span className="text-[12px] font-semibold text-ink">
																{location}
															</span>
														</div>
														<button
															type="button"
															aria-label="Edit address"
															className={iconBtn}
															onClick={() => setAddressOpen(true)}
														>
															<IonIcon
																icon={ICONS.edit}
																className="text-[11px]"
															/>
														</button>
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
												{!isBusiness && user.phone ? (
													<div className="mt-2 flex items-center gap-2 leading-none">
														<span className={META_ICON_BOX}>
															<IonIcon
																icon={callOutline}
																className="text-[13px] text-muted-light"
															/>
														</span>
														<div className="min-w-0">
															<span className="block text-[11px] font-medium text-muted-light">
																Phone
															</span>
															<span className="block truncate text-[13.5px] font-bold text-ink">
																{user.phone}
															</span>
														</div>
													</div>
												) : null}
											</div>
										</div>

										{detail && detail.reviewsCount > 0 ? (
											<button
												type="button"
												onClick={scrollToReviews}
												className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface-muted px-3 py-2.5 active:bg-[#eef1f6]"
											>
												<span className="text-[18px] font-extrabold text-ink">
													{(
														detail.reviewsBreakdown?.average ??
														detail.ratingAverage
													).toFixed(1)}
												</span>
												<Stars
													value={
														detail.reviewsBreakdown?.average ??
														detail.ratingAverage
													}
												/>
												<span className="text-[12px] text-muted-light">
													{detail.reviewsCount} review
													{detail.reviewsCount === 1 ? "" : "s"}
												</span>
												<IonIcon
													icon={ICONS.chevronForward}
													className="ml-auto text-base text-muted-light"
												/>
											</button>
										) : null}

										{isBusiness || about ? (
											<div className="mt-3">
												<div className="mb-0.5 flex items-center justify-between gap-2">
													<span className="block text-xs font-bold text-ink">
														About
													</span>
													<button
														type="button"
														aria-label="Edit about"
														className={iconBtn}
														onClick={() => setAboutOpen(true)}
													>
														<IonIcon
															icon={ICONS.edit}
															className="text-[11px]"
														/>
													</button>
												</div>
												{about ? (
													<ReadMoreText
														text={about}
														lines={4}
														title="About"
														className="m-0 text-[11px] font-medium leading text-muted"
													/>
												) : (
													<p className="m-0 text-[11px] font-medium text-muted-light">
														Add a short description so people know what you do.
													</p>
												)}
											</div>
										) : null}
									</section>

									{/* ---- Completion (P12) ---- */}
									{percent < 100 ? (
										<section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1220] via-[#1c3259] to-primary p-4 text-white">
											<div className="flex items-center justify-between gap-4">
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
											</div>
											<div className="mt-4 grid grid-cols-1 gap-1.5 rounded-xl bg-black/20 p-2.5">
												{steps.map((step) => (
													<button
														key={step.label}
														type="button"
														onClick={step.action}
														className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left active:bg-white/10"
													>
														<span
															className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${
																step.done
																	? "border-success bg-success text-white"
																	: "border-white/70 bg-transparent text-transparent"
															}`}
														>
															<IonIcon
																icon={checkmarkOutline}
																className="text-[11px]"
															/>
														</span>
														<span
															className={`text-[12.5px] font-semibold ${
																step.done
																	? "text-white/60 line-through"
																	: "text-white"
															}`}
														>
															{step.label}
														</span>
														{!step.done ? (
															<IonIcon
																icon={ICONS.chevronForward}
																className="ml-auto text-sm text-white/50"
															/>
														) : null}
													</button>
												))}
											</div>
										</section>
									) : null}

									{/* ---- Portfolio / Supplier catalog (P17) ---- */}
									{user.userType === "supplier" ? (
										<SupplierCatalogSection />
									) : (
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
												<>
													<div className="grid grid-cols-2 gap-3.5">
														{pagedPortfolio.map((item, i) => (
															<PortfolioTile
																key={item.id}
																item={item}
																pending={item.pending}
																photoCount={item.photoCount}
																onOpen={() =>
																	setLightbox({
																		images: portfolioImages,
																		index: portfolioOffset + i,
																	})
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
													{portfolioPages > 1 ? (
														<Pager
															page={portfolioSafePage}
															totalPages={portfolioPages}
															onChange={setPortfolioPage}
														/>
													) : null}
												</>
											) : (
												<p className={emptyBox}>
													No portfolio yet. Add your projects to showcase your
													work.
												</p>
											)}
										</section>
									)}

									{/* ---- Rating & Reviews ---- */}
									{hasReviews && detail ? (
										<div ref={reviewsRef} className="flex flex-col gap-4">
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

				<AboutModal
					isOpen={aboutOpen}
					about={about}
					onClose={() => setAboutOpen(false)}
					onSaved={() => setReloadKey((k) => k + 1)}
				/>

				<AddressModal
					isOpen={addressOpen}
					user={user}
					onClose={() => setAddressOpen(false)}
					onSaved={() => setReloadKey((k) => k + 1)}
				/>

				<ImageCropperModal
					file={cropFile}
					onClose={() => setCropFile(null)}
					onCropped={onCropped}
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
