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
// Experienced".)
const SORT_LATEST = { value: "latest", label: "Latest" };
const SORT_NEAREST = { value: "nearest", label: "Nearest" };
const SORT_TOP_RATED = { value: "topRated", label: "Top Rated" };

/** The track's "Type" left-label (professionals/suppliers only). */
const TYPE_LABEL: Partial<Record<DirectoryCategoryId, string>> = {
	professionals: "Professionals",
	"material-suppliers": "Materials",
};

const placesOf = (sel: FilterSelection): string[] =>
	Object.entries(sel)
		.filter(([key]) => key.startsWith("city:"))
		.flatMap(([, tokens]) => tokens);

export default function Professionals() {
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
		const sortGroup: FilterGroup = {
			key: "sort",
			label: "Sort by",
			header: "Sort by",
			multi: false,
			options: [
				SORT_LATEST,
				...(location ? [SORT_NEAREST] : []),
				...(category === "professionals" ? [SORT_TOP_RATED] : []),
			],
		};
		const list: FilterGroup[] = [sortGroup];
		const typeLabel = TYPE_LABEL[category];
		if (typeLabel && categories.length) {
			list.push({
				key: "type",
				label: typeLabel,
				header: "Select Type",
				multi: false,
				options: categories.map((c) => ({
					value: String(c.id),
					label: c.value,
				})),
			});
		}
		const isSupplier = category === "material-suppliers";
		list.push({
			key: "flags",
			label: "Ratings",
			header: isSupplier ? "Ratings & Products" : "Ratings & Portfolio",
			multi: true,
			options: [
				{ value: "hasReviews", label: "Has Reviews" },
				{
					value: "hasPortfolio",
					label: isSupplier ? "Has Products Available" : "Has Portfolio",
				},
			],
		});
		// Brand facet — suppliers only (the API returns brands for that track).
		if (isSupplier && brands.length) {
			list.push({
				key: "brand",
				label: "Brands",
				header: "Select Brand",
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
	}, [category, categories, locations, brands, location]);

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
			<AppHeader title="Professionals" tinted showLocation />
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
								placeholder="Search professionals, dealers & suppliers"
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
									message="Couldn't load professionals. Pull down to retry."
								/>
							) : items.length === 0 ? (
								<EmptyState
									icon={peopleOutline}
									message="No professionals match your filters."
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
						aria-label="Filters"
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
