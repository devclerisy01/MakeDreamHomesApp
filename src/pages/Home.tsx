import {
	IonContent,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonRouterLink,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import { LeadCard } from "@/components/cards/LeadCard";
import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { HeroArt } from "@/components/common/HeroArt";
import { SkeletonList } from "@/components/common/Skeletons";
import { ViewAllLink } from "@/components/common/ViewAllLink";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { HOME_LEAD_TABS, HOME_PRO_TABS } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { getLeads } from "@/lib/api/leads";
import { fetchProfessionals } from "@/lib/api/professionals";
import { locationToGeo, useSelectedLocation } from "@/lib/geo/location-store";
import { CARD, LIST_GRID, SECTION_HEAD, SECTION_TITLE } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type {
	DirectoryCategoryId,
	Lead,
	LeadCategoryId,
	ProfessionalListing,
} from "@/types";

const LEAD_LIMIT = 6;
const PRO_LIMIT = 4;

/** Read a tab id from the Home URL query, falling back when absent/unknown. */
function readCategory<T extends string>(
	search: string,
	key: string,
	allowed: readonly { id: T }[],
	fallback: T,
): T {
	const value = new URLSearchParams(search).get(key);
	return allowed.some((tab) => tab.id === value) ? (value as T) : fallback;
}

export default function Home() {
	const history = useHistory();
	// Tabs are URL-driven (deep-linkable) and seeded once from the query.
	const [leadTab, setLeadTab] = useState<LeadCategoryId>(() =>
		readCategory(
			history.location.search,
			"leadCategory",
			HOME_LEAD_TABS,
			"professional",
		),
	);
	const [leads, setLeads] = useState<Lead[] | null>(null);
	const [proTab, setProTab] = useState<DirectoryCategoryId>(() =>
		readCategory(
			history.location.search,
			"proCategory",
			HOME_PRO_TABS,
			"professionals",
		),
	);
	const [pros, setPros] = useState<ProfessionalListing[] | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const location = useSelectedLocation();

	// Reflect BOTH tabs into the URL on every switch (mirrors the web's
	// cross-preserve: changing one section never drops the other's selection).
	function syncTabs(lead: LeadCategoryId, pro: DirectoryCategoryId) {
		const params = new URLSearchParams(history.location.search);
		params.set("leadCategory", lead);
		params.set("proCategory", pro);
		history.replace(`${ROUTES.home}?${params.toString()}`);
	}

	function changeLeadTab(id: LeadCategoryId) {
		setLeadTab(id);
		syncTabs(id, proTab);
	}

	function changeProTab(id: DirectoryCategoryId) {
		setProTab(id);
		syncTabs(leadTab, id);
	}

	useEffect(() => {
		const controller = new AbortController();
		setLeads(null);
		getLeads(
			{ category: leadTab, limit: LEAD_LIMIT, ...locationToGeo(location) },
			controller.signal,
		)
			.then((res) => {
				if (!controller.signal.aborted) setLeads(res.items);
			})
			.catch(() => {
				if (!controller.signal.aborted) setLeads([]);
			});
		return () => controller.abort();
	}, [leadTab, reloadKey, location]);

	useEffect(() => {
		const controller = new AbortController();
		setPros(null);
		fetchProfessionals(
			{ category: proTab, limit: PRO_LIMIT, ...locationToGeo(location) },
			controller.signal,
		)
			.then((res) => {
				if (!controller.signal.aborted) setPros(res.items);
			})
			.catch(() => {
				if (!controller.signal.aborted) setPros([]);
			});
		return () => controller.abort();
	}, [proTab, reloadKey, location]);

	return (
		<IonPage>
			<AppHeader showLogo tinted showLocation />
			<IonContent style={{ "--background": "#f6f7fb" } as React.CSSProperties}>
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
					{/* Light-blue gradient backdrop behind the search + promo banner. */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-gradient-to-b from-[#e8f3fc] to-[#f6f7fb]"
					/>
					<Container wide>
						<div className="relative z-10">
							<GlobalSearch />

							<section
								className={`mt-3 flex items-stretch gap-1 overflow-hidden pr-4 !border-none ${CARD}`}
							>
								<div className="flex min-w-0 flex-1 flex-col p-3">
									<h2 className="m-0 text-[12px] font-bold leading-[1.3] text-ink">
										Hire a professional, buy/sell property or construction
										material
									</h2>
									<p className="mb-2.5 mt-1 text-[9px] leading-snug text-muted-light">
										Choose a{" "}
										<IonRouterLink
											routerLink={`${ROUTES.professionals}?type=professionals`}
											className="font-semibold text-primary underline decoration-primary/40"
										>
											Professional
										</IonRouterLink>
										,{" "}
										<IonRouterLink
											routerLink={`${ROUTES.professionals}?type=property-dealers`}
											className="font-semibold text-primary underline decoration-primary/40"
										>
											Property Dealer
										</IonRouterLink>{" "}
										or{" "}
										<IonRouterLink
											routerLink={`${ROUTES.professionals}?type=material-suppliers`}
											className="font-semibold text-primary underline decoration-primary/40"
										>
											Supplier
										</IonRouterLink>{" "}
										based on portfolio &amp; reviews
									</p>
									<IonRouterLink
										routerLink={ROUTES.requirement}
										className="mt-1 block w-fit no-underline"
									>
										<span className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12px] font-semibold leading-none text-white">
											Post Your Requirement
											<IonIcon
												icon={ICONS.arrowForward}
												className="text-[14px]"
											/>
										</span>
									</IonRouterLink>
								</div>
								<HeroArt className="h-auto w-[38%] max-w-[140px] shrink-0 self-end" />
							</section>

							<section className="mt-[22px]">
								<div className={SECTION_HEAD}>
									<h2 className={SECTION_TITLE}>Latest Leads</h2>
									<ViewAllLink
										routerLink={`${ROUTES.leads}?category=${leadTab}`}
									/>
								</div>
								<CategoryTabs
									tabs={HOME_LEAD_TABS}
									active={leadTab}
									onChange={changeLeadTab}
								/>
								<div className="mt-3">
									{leads === null ? (
										<SkeletonList count={3} variant="lead" />
									) : leads.length === 0 ? (
										<EmptyState
											icon={ICONS.info}
											message="No leads in this category yet."
										/>
									) : (
										<div className={LIST_GRID}>
											{leads.map((lead) => (
												<LeadCard key={lead.id} lead={lead} showSave={false} />
											))}
										</div>
									)}
								</div>
							</section>

							<section className="mt-[22px]">
								<div className={SECTION_HEAD}>
									<h2 className={SECTION_TITLE}>Find Professionals</h2>
									<ViewAllLink
										routerLink={`${ROUTES.professionals}?type=${proTab}`}
									/>
								</div>
								<CategoryTabs
									tabs={HOME_PRO_TABS}
									active={proTab}
									onChange={changeProTab}
								/>
								<div className="mt-3">
									{pros === null ? (
										<SkeletonList count={2} variant="pro" />
									) : pros.length === 0 ? (
										<EmptyState
											icon={ICONS.info}
											message="No professionals in this category yet."
										/>
									) : (
										<div className={LIST_GRID}>
											{pros.map((pro) => (
												<ProfessionalCard
													key={pro.id}
													pro={pro}
													showSave={false}
												/>
											))}
										</div>
									)}
								</div>
							</section>
						</div>
					</Container>
				</div>
			</IonContent>
		</IonPage>
	);
}
