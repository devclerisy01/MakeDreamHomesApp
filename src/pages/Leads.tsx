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
import { alertCircleOutline, documentTextOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslations } from "use-intl";

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
import { ICONS } from "@/theme/icons";
import type { LeadCategoryId } from "@/types";

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
	const translate = useTranslations();
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
	// Selected property groups, each expanded to its type tokens (matches the web).
	const propertyGroup = useMemo(
		() =>
			(selection.propertyGroup ?? []).flatMap(
				(g) => PROPERTY_GROUP_TOKENS[g] ?? [g],
			),
		[selection],
	);
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
		const sortBy = translate("mobile.filters.sortBy");
		const sortGroup: FilterGroup = {
			key: "sort",
			label: sortBy,
			header: sortBy,
			multi: false,
			options: location
				? [
						{ value: "nearest", label: translate("common.sort.nearest") },
						{ value: "latest", label: translate("common.sort.latest") },
					]
				: [{ value: "latest", label: translate("common.sort.latest") }],
		};
		// "Looking to" intent group (property + material tracks).
		const intentGroup: FilterGroup = {
			key: "intent",
			label: translate("filters.intent"),
			header: translate("filters.intent"),
			multi: true,
			options: [
				{ value: "buy", label: translate("postRequirement.intentBuyLeads") },
				{ value: "sell", label: translate("postRequirement.intentSellLeads") },
			],
		};
		const list: FilterGroup[] = [sortGroup];
		// Web parity: property → Property Type + Looking to; material → Looking to;
		// professional → no intent/property filter (only sort + profession below).
		if (category === "property") {
			// Property category multi-select; each group expands to its type tokens.
			const propertyType = translate("profile.propertyType");
			list.push(
				{
					key: "propertyGroup",
					label: propertyType,
					header: propertyType,
					multi: true,
					options: [
						{
							value: "residential",
							label: translate("postRequirement.propertyResidential"),
						},
						{
							value: "commercial",
							label: translate("postRequirement.propertyCommercial"),
						},
						{
							value: "agriculture",
							label: translate("postRequirement.propertyAgriculture"),
						},
					],
				},
				intentGroup,
			);
		} else if (category === "material") {
			list.push(intentGroup);
		}
		// Sub-category (profession / product) — single-select, from the catalogue.
		if (
			(category === "professional" || category === "material") &&
			categories.length
		) {
			const subLabel =
				category === "professional"
					? translate("profile.profession")
					: translate("common.product");
			list.push({
				key: "subcategory",
				label: subLabel,
				header: subLabel,
				multi: false,
				options: categories.map((c) => ({ value: c.value, label: c.value })),
			});
		}
		for (const loc of locations) {
			list.push({
				key: `city:${loc.id}`,
				label: loc.label,
				header: translate("mobile.filters.selectArea"),
				multi: true,
				options: loc.areas.map((a) => ({
					value: a.value,
					label: a.label,
					count: a.count,
				})),
			});
		}
		return list;
	}, [category, categories, locations, location, translate]);

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
			<AppHeader
				title={translate("mobile.leads.headerTitle")}
				tinted
				showLocation
			/>
			<IonContent style={{ "--background": "#f6f7fb" } as React.CSSProperties}>
				<IonRefresher
					slot="fixed"
					onIonRefresh={(event) => {
						reload();
						event.detail.complete();
					}}
				>
					<IonRefresherContent />
				</IonRefresher>

				<div className="relative">
					{/* Light-blue gradient backdrop behind the search + tabs. */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-x-0 top-0 h-[180px] bg-gradient-to-b from-[#e8f3fc] to-[#f6f7fb]"
					/>
					<Container>
						<div className="relative z-10">
							<SearchBar
								key={urlSearch}
								defaultValue={urlSearch}
								onSearch={setSearch}
								placeholder={translate("leads.searchPlaceholder")}
							/>
							<div className="mt-3">
								<CategoryTabs
									tabs={LEAD_TABS}
									active={category}
									onChange={setCategory}
								/>
							</div>
						</div>

						<div className="relative z-10 mt-3.5">
							{status === "loading" ? (
								<SkeletonList count={5} variant="lead" />
							) : status === "error" ? (
								<EmptyState
									icon={alertCircleOutline}
									message={translate("mobile.leads.loadError")}
								/>
							) : items.length === 0 ? (
								<EmptyState
									icon={documentTextOutline}
									message={translate("common.noResultsTitle")}
									description={translate("common.noResultsText")}
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
				</div>

				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton
						aria-label={translate("filters.title")}
						className="mdh-fab"
						onClick={() => setFiltersOpen(true)}
					>
						<IonIcon icon={ICONS.filters} className="text-white" />
					</IonFabButton>
					{activeFilterCount > 0 ? (
						<span className="pointer-events-none absolute right-0 -top-2.5 z-10 grid h-6 min-w-6 -translate-y-1 translate-x-1 place-items-center rounded-full border-2 border-white bg-danger px-1 text-xs font-bold text-white">
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
