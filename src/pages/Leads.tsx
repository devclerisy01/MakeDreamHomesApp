import {
	IonContent,
	IonFab,
	IonFabButton,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonPage,
	IonRefresher,
	IonRefresherContent,
} from "@ionic/react";
import {
	alertCircleOutline,
	documentTextOutline,
	optionsOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { LeadCard } from "@/components/cards/LeadCard";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchBar } from "@/components/common/SearchBar";
import { SkeletonList } from "@/components/common/Skeletons";
import {
	type FilterGroup,
	FilterModal,
	type FilterSelection,
} from "@/components/filters/FilterModal";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { LISTING_PAGE_SIZE } from "@/config/api";
import { DEFAULT_LEAD_CATEGORY, LEAD_TABS } from "@/constants/categories";
import { decodeProfessionalId } from "@/constants/routes";
import { fetchLeadFilters, getLeads } from "@/lib/api/leads";
import type { LocationFacet } from "@/lib/api/professionals";
import { usePagedList } from "@/hooks/usePagedList";
import { LIST_GRID } from "@/lib/ui";
import type { LeadCategoryId } from "@/types";

const INTENT_GROUP: FilterGroup = {
	key: "intent",
	label: "Looking to",
	header: "Looking to",
	multi: true,
	options: [
		{ value: "buy", label: "Buy" },
		{ value: "sell", label: "Sell" },
	],
};

const PROPERTY_GROUP_GROUP: FilterGroup = {
	key: "propertyGroup",
	label: "Category",
	header: "Property Category",
	multi: true,
	options: [
		{ value: "residential", label: "Residential" },
		{ value: "commercial", label: "Commercial" },
		{ value: "agriculture", label: "Agriculture" },
	],
};

const PROPERTY_TYPE_GROUP: FilterGroup = {
	key: "propertyType",
	label: "Type",
	header: "Property Type",
	multi: true,
	options: [
		{ value: "plot", label: "Plot" },
		{ value: "flat", label: "Flat" },
		{ value: "kothi", label: "Kothi" },
	],
};

const placesOf = (sel: FilterSelection): string[] =>
	Object.entries(sel)
		.filter(([key]) => key.startsWith("city:"))
		.flatMap(([, tokens]) => tokens);

export default function Leads() {
	const { search: qs } = useLocation();
	const userId = useMemo(() => {
		const raw = new URLSearchParams(qs).get("userId");
		if (!raw) return undefined;
		try {
			return decodeProfessionalId(raw);
		} catch {
			return undefined;
		}
	}, [qs]);
	const urlSearch = useMemo(
		() => new URLSearchParams(qs).get("search")?.trim() ?? "",
		[qs],
	);

	const [category, setCategory] = useState<LeadCategoryId>(
		DEFAULT_LEAD_CATEGORY,
	);
	const [search, setSearch] = useState(urlSearch);

	// Adopt a search term arriving from the URL (e.g. Home "View all").
	useEffect(() => {
		setSearch(urlSearch);
	}, [urlSearch]);
	const [selection, setSelection] = useState<FilterSelection>({});
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [locations, setLocations] = useState<LocationFacet[]>([]);

	// Intent/property-group facets are per-category, so clear on tab change.
	useEffect(() => {
		setSelection({});
	}, [category]);

	const intent = useMemo(() => selection.intent ?? [], [selection]);
	const propertyGroup = useMemo(
		() => selection.propertyGroup ?? [],
		[selection],
	);
	const propertyType = useMemo(() => selection.propertyType ?? [], [selection]);
	const places = useMemo(() => placesOf(selection), [selection]);
	const activeFilterCount = useMemo(
		() => Object.values(selection).reduce((n, v) => n + v.length, 0),
		[selection],
	);

	// Location facets when the sheet opens (scoped to the applied filters).
	useEffect(() => {
		if (!filtersOpen) return;
		const controller = new AbortController();
		fetchLeadFilters(
			{ category, search, intent, propertyGroup, propertyType },
			controller.signal,
		)
			.then(setLocations)
			.catch(() => {});
		return () => controller.abort();
	}, [filtersOpen, category, search, intent, propertyGroup, propertyType]);

	const groups = useMemo<FilterGroup[]>(() => {
		const list: FilterGroup[] = [];
		if (category === "property")
			list.push(INTENT_GROUP, PROPERTY_GROUP_GROUP, PROPERTY_TYPE_GROUP);
		else if (category === "material") list.push(INTENT_GROUP);
		for (const loc of locations) {
			list.push({
				key: `city:${loc.id}`,
				label: loc.label,
				header: "Select Area",
				multi: true,
				options: loc.areas.map((a) => ({
					value: a.value,
					label: a.label,
					count: a.count,
				})),
			});
		}
		return list;
	}, [category, locations]);

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			getLeads(
				{
					category,
					search,
					userId,
					page,
					limit: LISTING_PAGE_SIZE,
					intent,
					propertyGroup,
					propertyType,
					places,
				},
				signal,
			),
		[category, search, userId, intent, propertyGroup, propertyType, places],
	);
	const { items, status, hasMore, loadMore, reload } = usePagedList(
		fetcher,
		`${category}|${search}|${userId ?? ""}|${JSON.stringify(selection)}`,
	);

	return (
		<IonPage>
			<AppHeader title="Latest Leads" />
			<IonContent>
				<IonRefresher
					slot="fixed"
					onIonRefresh={(event) => {
						reload();
						event.detail.complete();
					}}
				>
					<IonRefresherContent />
				</IonRefresher>

				<Container>
					<SearchBar
						key={urlSearch}
						defaultValue={urlSearch}
						onSearch={setSearch}
					/>
					<div className="mt-3">
						<CategoryTabs
							tabs={LEAD_TABS}
							active={category}
							onChange={setCategory}
						/>
					</div>

					<div className="mt-3.5">
						{status === "loading" ? (
							<SkeletonList count={5} variant="lead" />
						) : status === "error" ? (
							<EmptyState
								icon={alertCircleOutline}
								message="Couldn't load requirements. Pull down to retry."
							/>
						) : items.length === 0 ? (
							<EmptyState
								icon={documentTextOutline}
								message="No requirements match your filters."
							/>
						) : (
							<div className={LIST_GRID}>
								{items.map((lead) => (
									<LeadCard key={lead.id} lead={lead} />
								))}
							</div>
						)}
					</div>

					<IonInfiniteScroll
						disabled={!hasMore || status !== "ready"}
						onIonInfinite={(event) => {
							void loadMore().then(() =>
								(event.target as HTMLIonInfiniteScrollElement).complete(),
							);
						}}
					>
						<IonInfiniteScrollContent />
					</IonInfiniteScroll>
				</Container>

				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton
						aria-label="Filters"
						onClick={() => setFiltersOpen(true)}
					>
						<IonIcon icon={optionsOutline} />
					</IonFabButton>
					{activeFilterCount > 0 ? (
						<span className="pointer-events-none absolute right-0 top-0 z-10 grid h-6 min-w-6 -translate-y-1 translate-x-1 place-items-center rounded-full border-2 border-white bg-danger px-1 text-xs font-bold text-white">
							{activeFilterCount}
						</span>
					) : null}
				</IonFab>

				<FilterModal
					isOpen={filtersOpen}
					onClose={() => setFiltersOpen(false)}
					groups={groups}
					value={selection}
					onApply={setSelection}
				/>
			</IonContent>
		</IonPage>
	);
}
