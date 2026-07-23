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
import { alertCircleOutline, peopleOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslations } from "use-intl";

import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
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
import {
	DEFAULT_DIRECTORY_CATEGORY,
	DIRECTORY_TABS,
} from "@/constants/categories";
import { usePagedList } from "@/hooks/usePagedList";
import {
	type CategoryOption,
	getMaterialCategories,
	getProfessionalCategories,
} from "@/lib/api/misc";
import {
	type BrandFacet,
	fetchDirectoryFilters,
	fetchProfessionals,
	type LocationFacet,
} from "@/lib/api/professionals";
import { locationToGeo, useSelectedLocation } from "@/lib/geo/location-store";
import { LIST_GRID } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type { DirectoryCategoryId } from "@/types";

// Matches the web sort dropdown: Latest always; Nearest only when a location is
// active; Top Rated only on the professionals track. (Web does not expose "Most
// Experienced".) Labels are resolved via `translate()` inside the component.
const SORT_KEYS: Record<string, string> = {
	latest: "common.sort.latest",
	nearest: "common.sort.nearest",
	topRated: "common.sort.topRated",
};

/** The track's "Type" left-label key (professionals/suppliers only). */
const TYPE_LABEL_KEY: Partial<Record<DirectoryCategoryId, string>> = {
	professionals: "common.professionals",
	"material-suppliers": "mobile.filters.materials",
};

const placesOf = (sel: FilterSelection): string[] =>
	Object.entries(sel)
		.filter(([key]) => key.startsWith("city:"))
		.flatMap(([, tokens]) => tokens);

export default function Professionals() {
	const translate = useTranslations();
	const { search: qs } = useLocation();
	const urlSearch = useMemo(
		() => new URLSearchParams(qs).get("search")?.trim() ?? "",
		[qs],
	);
	// Deep-link track: `?type=professionals|property-dealers|material-suppliers`.
	const urlType = useMemo(() => {
		const t = new URLSearchParams(qs).get("type");
		return DIRECTORY_TABS.some((tab) => tab.id === t)
			? (t as DirectoryCategoryId)
			: null;
	}, [qs]);

	const [category, setCategory] = useState<DirectoryCategoryId>(
		urlType ?? DEFAULT_DIRECTORY_CATEGORY,
	);
	const [search, setSearch] = useState(urlSearch);
	const [selection, setSelection] = useState<FilterSelection>({});
	const location = useSelectedLocation();

	// Adopt a search term arriving from the URL (e.g. Home "View all").
	useEffect(() => {
		setSearch(urlSearch);
	}, [urlSearch]);
	// Adopt a track arriving from the URL (e.g. Home "View all" / deep link).
	useEffect(() => {
		if (urlType) setCategory(urlType);
	}, [urlType]);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [categories, setCategories] = useState<CategoryOption[]>([]);
	const [locations, setLocations] = useState<LocationFacet[]>([]);
	const [brands, setBrands] = useState<BrandFacet[]>([]);

	// Track switch preserves a still-valid sort (matches web, which carries
	// `search` + `sort` forward); the per-track type facet, rating flags and
	// locality tokens are all cleared. "Top Rated" is dropped when leaving the
	// professionals track since it isn't offered elsewhere.
	useEffect(() => {
		setSelection((prev) => {
			const sort = prev.sort?.[0];
			const keepSort =
				sort && (sort !== "topRated" || category === "professionals");
			const next: FilterSelection = {};
			if (keepSort) next.sort = prev.sort;
			return next;
		});
	}, [category]);

	const typeId = selection.type?.[0];
	const sort = selection.sort?.[0];
	const places = useMemo(() => placesOf(selection), [selection]);
	const flags = useMemo(() => selection.flags ?? [], [selection]);
	const brandSel = useMemo(() => selection.brand ?? [], [selection]);
	const activeFilterCount = useMemo(
		() => Object.values(selection).reduce((n, v) => n + v.length, 0),
		[selection],
	);

	// Load the facet data when the sheet opens (scoped to the applied filters).
	useEffect(() => {
		if (!filtersOpen) return;
		const controller = new AbortController();
		const loadCats =
			category === "professionals"
				? getProfessionalCategories
				: category === "material-suppliers"
					? getMaterialCategories
					: null;
		if (loadCats) {
			loadCats(controller.signal)
				.then(setCategories)
				.catch(() => {});
		} else {
			setCategories([]);
		}
		fetchDirectoryFilters(
			{
				category,
				search,
				professionalUserType: category === "professionals" ? typeId : undefined,
				productType: category === "material-suppliers" ? typeId : undefined,
				hasReviews: flags.includes("hasReviews"),
				hasPortfolio: flags.includes("hasPortfolio"),
				hasLeads: flags.includes("hasLeads"),
				isReraCertified: flags.includes("isReraCertified"),
				authorizedOnly: flags.includes("authorizedOnly"),
				...locationToGeo(location),
			},
			controller.signal,
		)
			.then((res) => {
				setLocations(res.locations);
				setBrands(res.brands);
			})
			.catch(() => {});
		return () => controller.abort();
	}, [filtersOpen, category, search, typeId, flags, location]);

	const groups = useMemo<FilterGroup[]>(() => {
		const sortOption = (value: string) => ({
			value,
			label: translate(SORT_KEYS[value]),
		});
		const sortBy = translate("mobile.filters.sortBy");
		const sortGroup: FilterGroup = {
			key: "sort",
			label: sortBy,
			header: sortBy,
			multi: false,
			options: [
				sortOption("latest"),
				...(location ? [sortOption("nearest")] : []),
				...(category === "professionals" ? [sortOption("topRated")] : []),
			],
		};
		const list: FilterGroup[] = [sortGroup];
		const typeLabelKey = TYPE_LABEL_KEY[category];
		if (typeLabelKey && categories.length) {
			list.push({
				key: "type",
				label: translate(typeLabelKey),
				header: translate("mobile.filters.selectType"),
				multi: false,
				options: categories.map((c) => ({
					value: String(c.id),
					label: c.value,
				})),
			});
		}
		const isSupplier = category === "material-suppliers";
		const isDealer = category === "property-dealers";
		const quickFilters = translate("filters.quickFilters");
		// Quick Filters — mirrors the web sidebar's boolean toggles, including the
		// track-specific ones (RERA for dealers, Authorized for suppliers).
		list.push({
			key: "flags",
			label: quickFilters,
			header: quickFilters,
			multi: true,
			options: [
				{ value: "hasReviews", label: translate("filters.hasReviews") },
				{
					value: "hasPortfolio",
					label: isSupplier
						? translate("filters.hasProducts")
						: translate("filters.hasPortfolio"),
				},
				{
					value: "hasLeads",
					label: isSupplier
						? translate("filters.hasDeals")
						: translate("filters.hasLeads"),
				},
				...(isDealer
					? [
							{
								value: "isReraCertified",
								label: translate("filters.isReraCertified"),
							},
						]
					: []),
				...(isSupplier
					? [
							{
								value: "authorizedOnly",
								label: translate("filters.authorizedOnly"),
							},
						]
					: []),
			],
		});
		// Brand facet — suppliers only (the API returns brands for that track).
		if (isSupplier && brands.length) {
			list.push({
				key: "brand",
				label: translate("filters.brands"),
				header: translate("mobile.filters.selectBrand"),
				multi: true,
				options: brands.map((b) => ({
					value: b.value,
					label: b.label,
					count: b.count,
				})),
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
	}, [category, categories, locations, brands, location, translate]);

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			fetchProfessionals(
				{
					category,
					search,
					sort,
					page,
					limit: LISTING_PAGE_SIZE,
					professionalUserType:
						category === "professionals" && typeId ? typeId : undefined,
					productType:
						category === "material-suppliers" && typeId ? typeId : undefined,
					places,
					hasReviews: flags.includes("hasReviews"),
					hasPortfolio: flags.includes("hasPortfolio"),
					hasLeads: flags.includes("hasLeads"),
					isReraCertified: flags.includes("isReraCertified"),
					authorizedOnly: flags.includes("authorizedOnly"),
					brands: brandSel,
					...locationToGeo(location),
				},
				signal,
			),
		[category, search, sort, typeId, places, flags, brandSel, location],
	);
	const { items, status, hasMore, loadMore, reload } = usePagedList(
		fetcher,
		`${category}|${search}|${location?.city ?? ""}|${JSON.stringify(selection)}`,
	);

	return (
		<IonPage>
			<AppHeader
				title={translate("common.professionals")}
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
								showNearMe
								placeholder={translate("directory.searchPlaceholder")}
							/>
							<div className="mt-3">
								<CategoryTabs
									tabs={DIRECTORY_TABS}
									active={category}
									onChange={setCategory}
								/>
							</div>
						</div>

						<div className="relative z-10 mt-3.5">
							{status === "loading" ? (
								<SkeletonList count={5} variant="pro" />
							) : status === "error" ? (
								<EmptyState
									icon={alertCircleOutline}
									message={translate("mobile.professionals.loadError")}
								/>
							) : items.length === 0 ? (
								<EmptyState
									icon={peopleOutline}
									message={translate("common.noResultsTitle")}
									description={translate("common.noResultsText")}
								/>
							) : (
								<div className={LIST_GRID}>
									{items.map((pro) => (
										<ProfessionalCard key={pro.id} pro={pro} />
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
