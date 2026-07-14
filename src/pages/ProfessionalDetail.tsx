import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { alertCircleOutline, locationOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { PortfolioCard } from "@/components/cards/PortfolioCard";
import { RatingBreakdown } from "@/components/cards/RatingBreakdown";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { SaveButton } from "@/components/common/SaveButton";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { getProfessionalDetail } from "@/lib/api/professionals";
import {
	CARD,
	PORTFOLIO_GRID,
	SECTION_HEAD,
	SECTION_TITLE,
	TAG_PRIMARY,
} from "@/lib/ui";
import type { ProfessionalDetail as ProDetail } from "@/types";

type Status = "loading" | "ready" | "notfound";

export default function ProfessionalDetail() {
	const { slug } = useParams<{ slug: string }>();
	const [pro, setPro] = useState<ProDetail | null>(null);
	const [status, setStatus] = useState<Status>("loading");

	useEffect(() => {
		const controller = new AbortController();
		setStatus("loading");
		setPro(null);
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
		return () => controller.abort();
	}, [slug]);

	return (
		<IonPage>
			<AppHeader title={pro?.name ?? "Professional"} />
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
									{pro.about?.length ? (
										<div className="mt-2.5">
											<span className="mb-0.5 block text-xs font-bold text-muted-light">
												About
											</span>
											{pro.about.map((para, i) => (
												<p
													key={i}
													className="m-0 mb-1.5 text-[13.5px] leading-relaxed text-muted"
												>
													{para}
												</p>
											))}
										</div>
									) : null}
								</div>
							</section>

							{pro.portfolio?.length ? (
								<section className="mt-[22px]">
									<div className={SECTION_HEAD}>
										<h2 className={SECTION_TITLE}>Portfolio</h2>
									</div>
									<div className={PORTFOLIO_GRID}>
										{pro.portfolio.map((item) => (
											<PortfolioCard key={item.id} item={item} />
										))}
									</div>
								</section>
							) : null}

							{pro.reviewsCount > 0 && pro.reviewsBreakdown ? (
								<div className="mt-[22px]">
									<RatingBreakdown
										breakdown={pro.reviewsBreakdown}
										count={pro.reviewsCount}
									/>
								</div>
							) : null}
						</>
					)}
				</Container>
			</IonContent>
		</IonPage>
	);
}
