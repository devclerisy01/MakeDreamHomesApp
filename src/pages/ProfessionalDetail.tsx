import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { alertCircleOutline, locationOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { LeadCard } from "@/components/cards/LeadCard";
import { PortfolioCard } from "@/components/cards/PortfolioCard";
import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
import { RatingBreakdown } from "@/components/cards/RatingBreakdown";
import { ReviewsList } from "@/components/cards/ReviewsList";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { Lightbox } from "@/components/common/Lightbox";
import { ListingBadge } from "@/components/common/ListingBadge";
import { ReadMoreText } from "@/components/common/ReadMoreText";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { ViewAllLink } from "@/components/common/ViewAllLink";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { CATEGORY_PLACEHOLDER_ICON } from "@/constants/categories";
import { encodeProfessionalId, ROUTES } from "@/constants/routes";
import { getLeads } from "@/lib/api/leads";
import {
	fetchSimilarProfessionals,
	getProfessionalDetail,
} from "@/lib/api/professionals";
import { hasReviewed } from "@/lib/api/reviews";
import { useStartChat } from "@/lib/chat/use-start-chat";
import { useLogin } from "@/lib/auth/login-gate";
import { useAuth } from "@/lib/auth/session";
import { usePortfolioGallery } from "@/lib/portfolio/use-portfolio-gallery";
import {
	CARD,
	LIST_GRID,
	PORTFOLIO_GRID,
	SECTION_HEAD,
	SECTION_TITLE,
} from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type {
	DirectoryCategoryId,
	Lead,
	ProfessionalDetail as ProDetail,
	ProfessionalListing,
} from "@/types";

type Status = "loading" | "ready" | "notfound";

/** Rounded grey square that frames each profile meta icon (location / experience). */
const PRO_META_ICON =
	"flex size-[26px] shrink-0 items-center justify-center rounded-[6px] bg-[#F2F4F7]";

/** Showcase section heading by track (dealers show Properties, suppliers Products). */
const SHOWCASE_TITLE: Record<DirectoryCategoryId, string> = {
	professionals: "Portfolio",
	"property-dealers": "Properties",
	"material-suppliers": "Products",
};

/** Wrapped pill chips (supplier categories / brands). */
function ChipRow({ items }: { items: string[] }) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{items.map((item) => (
				<span
					key={item}
					className="inline-flex rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-ink"
				>
					{item}
				</span>
			))}
		</div>
	);
}

/** Supplier-only "Categories" + "Brands" block on the profile card (DT7). */
function SupplierMeta({ pro }: { pro: ProDetail }) {
	if (pro.category !== "material-suppliers") return null;
	const categories = (pro.showcase?.items ?? [])
		.map((entry) => entry.title)
		.filter((title): title is string => !!title);
	const brands = pro.brands ?? [];
	if (!categories.length && !brands.length) return null;
	return (
		<div className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3">
			{categories.length ? (
				<div>
					<p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-light">
						Categories
					</p>
					<ChipRow items={categories} />
				</div>
			) : null}
			{brands.length ? (
				<div>
					<p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-light">
						Brands
					</p>
					<ChipRow items={brands} />
				</div>
			) : null}
		</div>
	);
}

export default function ProfessionalDetail() {
	const { slug } = useParams<{ slug: string }>();
	const { isAuthed, user } = useAuth();
	const { openLogin } = useLogin();
	const { startChat, busy: chatBusy } = useStartChat();
	const [pro, setPro] = useState<ProDetail | null>(null);
	const [status, setStatus] = useState<Status>("loading");
	const [reviewOpen, setReviewOpen] = useState(false);
	const [alreadyReviewed, setAlreadyReviewed] = useState(false);
	const [similar, setSimilar] = useState<ProfessionalListing[]>([]);
	const [leads, setLeads] = useState<Lead[]>([]);
	const [leadsTotal, setLeadsTotal] = useState(0);
	const { gallery, loadingId, openGallery, setIndex, closeGallery } =
		usePortfolioGallery();

	useEffect(() => {
		const controller = new AbortController();
		setStatus("loading");
		setPro(null);
		setAlreadyReviewed(false);
		setSimilar([]);
		getProfessionalDetail(slug, controller.signal)
			.then((data) => {
				if (controller.signal.aborted) return;
				if (data) {
					setPro(data);
					setStatus("ready");
				} else {
					setStatus("notfound");
				}
			})
			.catch(() => {
				if (!controller.signal.aborted) setStatus("notfound");
			});
		// Similar professionals rail (fails soft to empty).
		fetchSimilarProfessionals(slug, controller.signal)
			.then((list) => {
				if (!controller.signal.aborted) setSimilar(list);
			})
			.catch(() => {});
		return () => controller.abort();
	}, [slug]);

	// This user's active leads/deals, for the on-detail "Active Leads" section (DT11).
	useEffect(() => {
		if (!pro) {
			setLeads([]);
			setLeadsTotal(0);
			return;
		}
		const controller = new AbortController();
		getLeads({ userId: pro.id, limit: 4 }, controller.signal)
			.then((res) => {
				if (controller.signal.aborted) return;
				setLeads(res.items);
				setLeadsTotal(res.totalItems);
			})
			.catch(() => {
				if (!controller.signal.aborted) {
					setLeads([]);
					setLeadsTotal(0);
				}
			});
		return () => controller.abort();
	}, [pro]);

	// Whether the signed-in viewer has already reviewed this professional (hides
	// the Write-a-Review trigger).
	const isOwnProfile = Boolean(
		pro && user && String(user.id) === String(pro.id),
	);
	useEffect(() => {
		if (!isAuthed || !pro || isOwnProfile) return;
		let active = true;
		hasReviewed(pro.id)
			.then((reviewed) => {
				if (active) setAlreadyReviewed(reviewed);
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, [isAuthed, pro, isOwnProfile]);

	function onWriteReview() {
		if (!isAuthed) {
			// Resume the review flow once the user signs in (mirrors the web).
			openLogin({ onAuthenticated: () => setReviewOpen(true) });
			return;
		}
		setReviewOpen(true);
	}

	const writeReviewButton =
		!isOwnProfile && !alreadyReviewed ? (
			<button
				type="button"
				onClick={onWriteReview}
				className="inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-bold text-white"
			>
				<IonIcon icon={ICONS.edit} className="text-[16px]" />
				Write a Review
			</button>
		) : null;

	return (
		<IonPage>
			<AppHeader title={pro?.name ?? "Professional"} back tinted />
			<IonContent style={{ "--background": "#f6f7fb" } as React.CSSProperties}>
				<div className="relative">
					{/* Light-blue gradient backdrop behind the top profile card. */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-[#e8f3fc] to-[#f6f7fb]"
					/>
					<Container>
						<div className="relative z-10">
							{status === "loading" ? (
								<DetailSkeleton />
							) : status === "notfound" || !pro ? (
								<EmptyState
									icon={alertCircleOutline}
									message="Professional not found."
								/>
							) : (
								<>
									<section className={`p-3.5 ${CARD}`}>
										<div className="flex gap-3.5">
											<div className="relative shrink-0">
												<Avatar
													name={pro.name}
													image={pro.image}
													size={118}
													className="rounded-[10px]"
													fallbackIcon={CATEGORY_PLACEHOLDER_ICON[pro.category]}
												/>
												<ListingBadge
													item={pro}
													className="absolute left-1.5 top-1.5"
												/>
											</div>
											<div className="min-w-0 flex-1">
												<h2 className="text-sm font-bold leading-snug text-ink">
													{pro.name}
													{pro.profession ? (
														<span className="font-medium text-muted-light">
															{" · "}
															{pro.profession}
														</span>
													) : null}
												</h2>
												{pro.location ? (
													<div className="mt-2 flex items-center gap-2">
														<span className={PRO_META_ICON}>
															<IonIcon
																icon={locationOutline}
																className="text-[15px] text-muted-light"
															/>
														</span>
														<div className="min-w-0">
															<span className="block text-[11px] font-medium text-muted-light">
																Location
															</span>
															<span className="text-[13.5px] font-bold text-ink">
																{pro.location}
															</span>
														</div>
													</div>
												) : null}
												{pro.about?.length ? (
													<div className="mt-2">
														<span className="mb-0.5 block text-xs font-bold text-ink">
															About
														</span>
														<ReadMoreText
															text={pro.about.join("\n\n")}
															lines={5}
															title="About"
															className="m-0 text-[11px] leading-relaxed text-ink"
														/>
													</div>
												) : null}
											</div>
										</div>
										<SupplierMeta pro={pro} />
									</section>

									{!isOwnProfile ? (
										<button
											type="button"
											onClick={() => startChat(pro.id)}
											disabled={chatBusy}
											className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-[14px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
										>
											<IonIcon icon={ICONS.message} className="text-[17px]" />
											Send Message
										</button>
									) : null}

									{pro.portfolio?.length ? (
										<section className="mt-[22px]">
											<div className={SECTION_HEAD}>
												<h2 className={SECTION_TITLE}>
													{SHOWCASE_TITLE[pro.category] ?? "Portfolio"}
												</h2>
											</div>
											<div className={PORTFOLIO_GRID}>
												{pro.portfolio.map((item) => (
													<PortfolioCard
														key={item.id}
														item={item}
														isProduct={pro.category === "material-suppliers"}
														onOpen={() => openGallery(item)}
														loading={loadingId === item.id}
													/>
												))}
											</div>
										</section>
									) : null}

									{leads.length ? (
										<section className="mt-[22px]">
											<div className={SECTION_HEAD}>
												<h2 className={SECTION_TITLE}>
													{pro.category === "material-suppliers"
														? "Active Deals"
														: "Active Leads"}
												</h2>
												{leadsTotal > leads.length ? (
													<ViewAllLink
														routerLink={`${ROUTES.leads}?userId=${encodeProfessionalId(
															pro.id,
														)}`}
													/>
												) : null}
											</div>
											<div className={LIST_GRID}>
												{leads.map((lead) => (
													<LeadCard
														key={lead.id}
														lead={lead}
														showSave={false}
													/>
												))}
											</div>
										</section>
									) : null}

									<section className="mt-[22px]">
										{(pro.reviewsCount ?? pro.reviews?.length ?? 0) > 0 ? (
											<div className="flex flex-col gap-[22px]">
												{pro.reviewsBreakdown ? (
													<RatingBreakdown
														breakdown={pro.reviewsBreakdown}
														count={pro.reviewsCount}
														action={writeReviewButton}
													/>
												) : null}
												<ReviewsList
													userId={pro.id}
													initialReviews={pro.reviews ?? []}
													total={pro.reviewsCount ?? pro.reviews?.length ?? 0}
												/>
											</div>
										) : (
											<div className={`p-4 ${CARD}`}>
												<div className="mb-3 flex items-center justify-between gap-2">
													<h2 className="m-0 text-[15px] font-extrabold text-ink">
														Rating &amp; Reviews
													</h2>
													{writeReviewButton}
												</div>
												<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-muted px-6 py-8 text-center">
													<span className="grid h-14 w-14 place-items-center rounded-full bg-[#F5A623]/10 text-[#F5A623]">
														<IonIcon
															icon={ICONS.star}
															className="text-[26px]"
														/>
													</span>
													<h3 className="mt-3 text-[15px] font-bold text-ink">
														No reviews yet
													</h3>
													<p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-muted-light">
														{!isOwnProfile && !alreadyReviewed
															? "Be the first to share your experience and help others decide."
															: "Reviews from customers will appear here."}
													</p>
												</div>
											</div>
										)}
									</section>

									{similar.length ? (
										<section className="mt-[22px]">
											<div className={SECTION_HEAD}>
												<h2 className={SECTION_TITLE}>Similar professionals</h2>
											</div>
											<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
												{similar.map((s) => (
													<div key={s.id} className="w-[340px] shrink-0">
														<ProfessionalCard pro={s} />
													</div>
												))}
											</div>
										</section>
									) : null}
								</>
							)}
						</div>
					</Container>
				</div>
				{pro ? (
					<WriteReviewModal
						reviewForId={pro.id}
						name={pro.name}
						isOpen={reviewOpen}
						onClose={() => setReviewOpen(false)}
						onSubmitted={() => setAlreadyReviewed(true)}
					/>
				) : null}
				{gallery ? (
					<Lightbox
						images={gallery.images}
						index={gallery.index}
						onIndexChange={setIndex}
						onClose={closeGallery}
					/>
				) : null}
			</IonContent>
		</IonPage>
	);
}
