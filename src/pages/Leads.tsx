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
import {
	type CategoryOption,
	getMaterialCategories,
	getProfessionalCategories,
} from "@/lib/api/misc";
import type { LocationFacet } from "@/lib/api/professionals";
import { locationToGeo, useSelectedLocation } from "@/lib/geo/location-store";
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

const PRO_INTENT_GROUP: FilterGroup = {
	key: "intent",
	label: "Looking to",
	header: "Looking to",
	multi: true,
	options: [
		{ value: "hire", label: "Hiring" },
		{ value: "available", label: "Available for work" },
	],
};

// Single-select property category (mirrors the web); the chosen group is
// expanded to its concrete type tokens before querying so results match.
const PROPERTY_GROUP_GROUP: FilterGroup = {
	key: "propertyGroup",
	label: "Category",
	header: "Property Category",
	multi: false,
	options: [
		{ value: "residential", label: "Residential" },
		{ value: "commercial", label: "Commercial" },
		{ value: "agriculture", label: "Agriculture" },
	],
};

/** Expand a property group to the tokens the web sends (matches web's
 * `propertyGroupToTypes`; the API matches these against requirement+propertyType). */
const PROPERTY_GROUP_TOKENS: Record<string, string[]> = {
	residential: [
		"residential",
		"plot",
		"flat",
		"kothi",
		"villa",
		"bhk",
		"penthouse",
		"independent house",
	],
	commercial: ["commercial", "shop", "office", "showroom", "warehouse"],
	agriculture: ["agriculture", "agricultural"],
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
	// Deep-link track: `?category=professional|property|material`.
	const urlCategory = useMemo(() => {
		const c = new URLSearchParams(qs).get("category");
		return LEAD_TABS.some((tab) => tab.id === c) ? (c as LeadCategoryId) : null;
	}, [qs]);

	const [category, setCategory] = useState<LeadCategoryId>(
		urlCategory ?? DEFAULT_LEAD_CATEGORY,
	);
	const [search, setSearch] = useState(urlSearch);

	// Adopt a search term arriving from the URL (e.g. Home "View all").
	useEffect(() => {
		setSearch(urlSearch);
	}, [urlSearch]);
	// Adopt a track arriving from the URL (deep link / Home "View all").
	useEffect(() => {
		if (urlCategory) setCategory(urlCategory);
	}, [urlCategory]);
	const [selection, setSelection] = useState<FilterSelection>({});
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [locations, setLocations] = useState<LocationFacet[]>([]);
	const [categories, setCategories] = useState<CategoryOption[]>([]);
	const location = useSelectedLocation();

	// Intent/property-group facets are per-category, so clear on tab change.
	useEffect(() => {
		setSelection({});
	}, [category]);

	const intent = useMemo(() => selection.intent ?? [], [selection]);
	const subcategory = selection.subcategory?.[0];
	const sort = selection.sort?.[0];
	// Single property group, expanded to its type tokens (matches the web).
	const propertyGroup = useMemo(() => {
		const g = selection.propertyGroup?.[0];
		return g ? (PROPERTY_GROUP_TOKENS[g] ?? [g]) : [];
	}, [selection]);
	const places = useMemo(() => placesOf(selection), [selection]);
	const activeFilterCount = useMemo(
		() => Object.values(selection).reduce((n, v) => n + v.length, 0),
		[selection],
	);

	// Facet data (localities + sub-category options) when the sheet opens.
	useEffect(() => {
		if (!filtersOpen) return;
		const controller = new AbortController();
		const loadCats =
			category === "professional"
				? getProfessionalCategories
				: category === "material"
					? getMaterialCategories
					: null;
		if (loadCats) {
			loadCats(controller.signal)
				.then(setCategories)
				.catch(() => {});
		} else {
			setCategories([]);
		}
		fetchLeadFilters(
			{
				category,
				search,
				intent,
				subcategory,
				propertyGroup,
				...locationToGeo(location),
			},
			controller.signal,
		)
			.then(setLocations)
			.catch(() => {});
		return () => controller.abort();
	}, [
		filtersOpen,
		category,
		search,
		intent,
		subcategory,
		propertyGroup,
		location,
	]);

	const groups = useMemo<FilterGroup[]>(() => {
		// Sort — Latest, plus Nearest when a location is active (mirrors the web).
		const sortGroup: FilterGroup = {
			key: "sort",
			label: "Sort by",
			header: "Sort by",
			multi: false,
			options: location
				? [
						{ value: "nearest", label: "Nearest" },
						{ value: "latest", label: "Latest" },
					]
				: [{ value: "latest", label: "Latest" }],
		};
		const list: FilterGroup[] = [sortGroup];
		if (category === "property") {
			list.push(INTENT_GROUP, PROPERTY_GROUP_GROUP);
		} else if (category === "material") {
			list.push(INTENT_GROUP);
		} else if (category === "professional") {
			list.push(PRO_INTENT_GROUP);
		}
		// Sub-category (profession / product) — single-select, from the catalogue.
		if (
			(category === "professional" || category === "material") &&
			categories.length
		) {
			list.push({
				key: "subcategory",
				label: category === "professional" ? "Profession" : "Product",
				header: category === "professional" ? "Profession" : "Product",
				multi: false,
				options: categories.map((c) => ({ value: c.value, label: c.value })),
			});
		}
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
	}, [category, categories, locations, location]);

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			getLeads(
				{
					category,
					search,
					sort,
					userId,
					page,
					limit: LISTING_PAGE_SIZE,
					intent,
					subcategory,
					propertyGroup,
					places,
					...locationToGeo(location),
				},
				signal,
			),
		[
			category,
			search,
			sort,
			userId,
			intent,
			subcategory,
			propertyGroup,
			places,
			location,
		],
	);
	const { items, status, hasMore, loadMore, reload } = usePagedList(
		fetcher,
		`${category}|${search}|${userId ?? ""}|${location?.city ?? ""}|${JSON.stringify(selection)}`,
	);

	return (
		<IonPage>
			<AppHeader title="Latest Leads" showLocation />
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
