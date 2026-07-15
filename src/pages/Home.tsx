import {
	IonContent,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonRouterLink,
} from "@ionic/react";
import { arrowForward, informationCircleOutline } from "ionicons/icons";
import { useEffect, useState } from "react";

import { LeadCard } from "@/components/cards/LeadCard";
import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { HeroArt } from "@/components/common/HeroArt";
import { SkeletonList } from "@/components/common/Skeletons";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { HOME_LEAD_TABS, HOME_PRO_TABS } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { getLeads } from "@/lib/api/leads";
import { fetchProfessionals } from "@/lib/api/professionals";
import {
	CARD,
	LIST_GRID,
	SECTION_HEAD,
	SECTION_TITLE,
	VIEW_ALL,
} from "@/lib/ui";
import type {
	DirectoryCategoryId,
	Lead,
	LeadCategoryId,
	ProfessionalListing,
} from "@/types";

const LEAD_LIMIT = 6;
const PRO_LIMIT = 4;

export default function Home() {
	const [leadTab, setLeadTab] = useState<LeadCategoryId>("professional");
	const [leads, setLeads] = useState<Lead[] | null>(null);
	const [proTab, setProTab] = useState<DirectoryCategoryId>("professionals");
	const [pros, setPros] = useState<ProfessionalListing[] | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		setLeads(null);
		getLeads({ category: leadTab, limit: LEAD_LIMIT }, controller.signal)
			.then((res) => {
				if (!controller.signal.aborted) setLeads(res.items);
			})
			.catch(() => {
				if (!controller.signal.aborted) setLeads([]);
			});
		return () => controller.abort();
	}, [leadTab, reloadKey]);

	useEffect(() => {
		const controller = new AbortController();
		setPros(null);
		fetchProfessionals(
			{ category: proTab, limit: PRO_LIMIT },
			controller.signal,
		)
			.then((res) => {
				if (!controller.signal.aborted) setPros(res.items);
			})
			.catch(() => {
				if (!controller.signal.aborted) setPros([]);
			});
		return () => controller.abort();
	}, [proTab, reloadKey]);

	return (
		<IonPage>
			<AppHeader showLogo />
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

				<Container wide>
					<GlobalSearch />

					<section
						className={`mt-3 flex items-center gap-1 overflow-hidden bg-gradient-to-br from-white to-[#eaf1fd] py-3 pl-4 pr-1 ${CARD}`}
					>
						<div className="min-w-0 flex-1">
							<h2 className="m-0 text-[15px] font-extrabold leading-[1.25] text-ink">
								Hire a professional, buy/sell property or construction material
							</h2>
							<p className="mb-3 mt-1.5 text-[12px] leading-snug text-muted-light">
								Choose Professional, Property dealer or Supplier directly based
								on portfolio &amp; reviews
							</p>
							<IonRouterLink
								routerLink={ROUTES.requirement}
								className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-bold text-white no-underline"
							>
								Post Requirement
								<IonIcon icon={arrowForward} className="text-[15px]" />
							</IonRouterLink>
						</div>
						<HeroArt className="h-auto w-[40%] max-w-[172px] shrink-0 self-center" />
					</section>

					<section className="mt-[22px]">
						<div className={SECTION_HEAD}>
							<h2 className={SECTION_TITLE}>Latest Leads</h2>
							<IonRouterLink routerLink={ROUTES.leads} className={VIEW_ALL}>
								View All
								<IonIcon icon={arrowForward} />
							</IonRouterLink>
						</div>
						<CategoryTabs
							tabs={HOME_LEAD_TABS}
							active={leadTab}
							onChange={setLeadTab}
						/>
						<div className="mt-3">
							{leads === null ? (
								<SkeletonList count={3} variant="lead" />
							) : leads.length === 0 ? (
								<EmptyState
									icon={informationCircleOutline}
									message="No leads in this category yet."
								/>
							) : (
								<div className={LIST_GRID}>
									{leads.map((lead) => (
										<LeadCard key={lead.id} lead={lead} />
									))}
								</div>
							)}
						</div>
					</section>

					<section className="mt-[22px]">
						<div className={SECTION_HEAD}>
							<h2 className={SECTION_TITLE}>Find Professionals</h2>
							<IonRouterLink
								routerLink={ROUTES.professionals}
								className={VIEW_ALL}
							>
								View All
								<IonIcon icon={arrowForward} />
							</IonRouterLink>
						</div>
						<CategoryTabs
							tabs={HOME_PRO_TABS}
							active={proTab}
							onChange={setProTab}
						/>
						<div className="mt-3">
							{pros === null ? (
								<SkeletonList count={2} variant="pro" />
							) : pros.length === 0 ? (
								<EmptyState
									icon={informationCircleOutline}
									message="No professionals in this category yet."
								/>
							) : (
								<div className={LIST_GRID}>
									{pros.map((pro) => (
										<ProfessionalCard key={pro.id} pro={pro} />
									))}
								</div>
							)}
						</div>
					</section>
				</Container>
			</IonContent>
		</IonPage>
	);
}
