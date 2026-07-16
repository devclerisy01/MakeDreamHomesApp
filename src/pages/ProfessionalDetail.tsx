import { IonContent, IonIcon, IonPage } from "@ionic/react";
import {
	alertCircleOutline,
	briefcaseOutline,
	locationOutline,
	starOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { PortfolioCard } from "@/components/cards/PortfolioCard";
import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
import { RatingBreakdown } from "@/components/cards/RatingBreakdown";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { ReadMoreText } from "@/components/common/ReadMoreText";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { SaveButton } from "@/components/common/SaveButton";
import { WriteReviewModal } from "@/components/profile/WriteReviewModal";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import {
	fetchSimilarProfessionals,
	getProfessionalDetail,
} from "@/lib/api/professionals";
import { hasReviewed } from "@/lib/api/reviews";
import { useLogin } from "@/lib/auth/login-gate";
import { useAuth } from "@/lib/auth/session";
import {
	CARD,
	PORTFOLIO_GRID,
	SECTION_HEAD,
	SECTION_TITLE,
	TAG_PRIMARY,
} from "@/lib/ui";
import type {
	DirectoryCategoryId,
	ProfessionalDetail as ProDetail,
	ProfessionalListing,
} from "@/types";

type Status = "loading" | "ready" | "notfound";

/** Showcase section heading by track (dealers show Properties, suppliers Products). */
const SHOWCASE_TITLE: Record<DirectoryCategoryId, string> = {
	professionals: "Portfolio",
	"property-dealers": "Properties",
	"material-suppliers": "Products",
};

export default function ProfessionalDetail() {
	const { slug } = useParams<{ slug: string }>();
	const { isAuthed, user } = useAuth();
	const { openLogin } = useLogin();
	const [pro, setPro] = useState<ProDetail | null>(null);
	const [status, setStatus] = useState<Status>("loading");
	const [reviewOpen, setReviewOpen] = useState(false);
	const [alreadyReviewed, setAlreadyReviewed] = useState(false);
	const [similar, setSimilar] = useState<ProfessionalListing[]>([]);

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

	return (
		<IonPage>
			<AppHeader title={pro?.name ?? "Professional"} back />
			<IonContent>
				<Container>
					{status === "loading" ? (
						<DetailSkeleton />
					) : status === "notfound" || !pro ? (
						<EmptyState
							icon={alertCircleOutline}
							message="Professional not found."
						/>
					) : (
						<>
							<section className={`flex gap-3.5 p-3.5 ${CARD}`}>
								<Avatar
									name={pro.name}
									image={pro.image}
									size={110}
									className="rounded-[14px]"
								/>
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-2">
										{pro.profession ? (
											<span className={TAG_PRIMARY}>{pro.profession}</span>
										) : (
											<span />
										)}
										<SaveButton entityType="users" entityId={pro.id} />
									</div>
									<h2 className="mt-1.5 text-xl font-extrabold text-ink">
										{pro.name}
									</h2>
									{pro.location ? (
										<div className="mt-2.5 flex items-start gap-1.5">
											<IonIcon
												icon={locationOutline}
												className="mt-0.5 shrink-0 text-[17px] text-muted-light"
											/>
											<div className="min-w-0">
												<span className="block text-[11px] font-semibold text-muted-light">
													Location
												</span>
												<span className="text-[13.5px] font-bold text-ink">
													{pro.location}
												</span>
											</div>
										</div>
									) : null}
									{pro.experienceYears > 0 ? (
										<div className="mt-2.5 flex items-start gap-1.5">
											<IonIcon
												icon={briefcaseOutline}
												className="mt-0.5 shrink-0 text-[17px] text-muted-light"
											/>
											<div className="min-w-0">
												<span className="block text-[11px] font-semibold text-muted-light">
													Experience
												</span>
												<span className="text-[13.5px] font-bold text-ink">
													{pro.experienceYears}{" "}
													{pro.experienceYears === 1 ? "year" : "years"}
												</span>
											</div>
										</div>
									) : null}
									{pro.about?.length ? (
										<div className="mt-2.5">
											<span className="mb-0.5 block text-xs font-bold text-muted-light">
												About
											</span>
											<ReadMoreText
												text={pro.about.join("\n\n")}
												lines={5}
												title="About"
												className="m-0 text-[13.5px] leading-relaxed text-muted"
											/>
										</div>
									) : null}
								</div>
							</section>

							{pro.portfolio?.length ? (
								<section className="mt-[22px]">
									<div className={SECTION_HEAD}>
										<h2 className={SECTION_TITLE}>
											{SHOWCASE_TITLE[pro.category] ?? "Portfolio"}
										</h2>
									</div>
									<div className={PORTFOLIO_GRID}>
										{pro.portfolio.map((item) => (
											<PortfolioCard key={item.id} item={item} />
										))}
									</div>
								</section>
							) : null}

							<section className="mt-[22px]">
								<div className={SECTION_HEAD}>
									<h2 className={SECTION_TITLE}>Rating &amp; Reviews</h2>
									{!isOwnProfile && !alreadyReviewed ? (
										<button
											type="button"
											onClick={onWriteReview}
											className="inline-flex items-center gap-1 text-sm font-bold text-primary"
										>
											<IonIcon icon={starOutline} className="text-base" />
											Write a Review
										</button>
									) : null}
								</div>
								{(pro.reviewsCount ?? 0) > 0 && pro.reviewsBreakdown ? (
									<RatingBreakdown
										breakdown={pro.reviewsBreakdown}
										count={pro.reviewsCount}
									/>
								) : (
									<p className="m-0 rounded-2xl border border-dashed border-line bg-surface-muted px-4 py-6 text-center text-[13px] text-muted-light">
										No reviews yet.
										{!isOwnProfile && !alreadyReviewed
											? " Be the first to review."
											: ""}
									</p>
								)}
							</section>

							{similar.length ? (
								<section className="mt-[22px]">
									<div className={SECTION_HEAD}>
										<h2 className={SECTION_TITLE}>Similar professionals</h2>
									</div>
									<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
										{similar.map((s) => (
											<div key={s.id} className="w-[240px] shrink-0">
												<ProfessionalCard pro={s} />
											</div>
										))}
									</div>
								</section>
							) : null}
						</>
					)}
				</Container>
				{pro ? (
					<WriteReviewModal
						reviewForId={pro.id}
						name={pro.name}
						isOpen={reviewOpen}
						onClose={() => setReviewOpen(false)}
						onSubmitted={() => setAlreadyReviewed(true)}
					/>
				) : null}
			</IonContent>
		</IonPage>
	);
}
