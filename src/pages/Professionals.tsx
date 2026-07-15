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
	optionsOutline,
	peopleOutline,
} from "ionicons/icons";
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
	fetchDirectoryFilters,
	fetchProfessionals,
	type LocationFacet,
} from "@/lib/api/professionals";
import { LIST_GRID } from "@/lib/ui";
import type { DirectoryCategoryId } from "@/types";

const RATINGS_GROUP: FilterGroup = {
	key: "flags",
	label: "Ratings",
	header: "Ratings & Portfolio",
	multi: true,
	options: [
		{ value: "hasReviews", label: "Has Reviews" },
		{ value: "hasPortfolio", label: "Has Portfolio" },
	],
};

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

	const [category, setCategory] = useState<DirectoryCategoryId>(
		DEFAULT_DIRECTORY_CATEGORY,
	);
	const [search, setSearch] = useState(urlSearch);
	const [selection, setSelection] = useState<FilterSelection>({});

	// Adopt a search term arriving from the URL (e.g. Home "View all").
	useEffect(() => {
		setSearch(urlSearch);
	}, [urlSearch]);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [categories, setCategories] = useState<CategoryOption[]>([]);
	const [locations, setLocations] = useState<LocationFacet[]>([]);

	// The type facet is per-track, so clear selections when the track changes.
	useEffect(() => {
		setSelection({});
	}, [category]);

	const typeId = selection.type?.[0];
	const places = useMemo(() => placesOf(selection), [selection]);
	const flags = useMemo(() => selection.flags ?? [], [selection]);
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
			},
			controller.signal,
		)
			.then(setLocations)
			.catch(() => {});
		return () => controller.abort();
	}, [filtersOpen, category, search, typeId]);

	const groups = useMemo<FilterGroup[]>(() => {
		const list: FilterGroup[] = [];
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
		list.push(RATINGS_GROUP);
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
	}, [category, categories, locations]);

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			fetchProfessionals(
				{
					category,
					search,
					page,
					limit: LISTING_PAGE_SIZE,
					professionalUserType:
						category === "professionals" && typeId ? typeId : undefined,
					productType:
						category === "material-suppliers" && typeId ? typeId : undefined,
					places,
					hasReviews: flags.includes("hasReviews"),
					hasPortfolio: flags.includes("hasPortfolio"),
				},
				signal,
			),
		[category, search, typeId, places, flags],
	);
	const { items, status, hasMore, loadMore, reload } = usePagedList(
		fetcher,
		`${category}|${search}|${JSON.stringify(selection)}`,
	);

	return (
		<IonPage>
			<AppHeader title="Professionals" />
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
							tabs={DIRECTORY_TABS}
							active={category}
							onChange={setCategory}
						/>
					</div>

					<div className="mt-3.5">
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
