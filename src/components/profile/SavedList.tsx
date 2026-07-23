import { IonInfiniteScroll, IonInfiniteScrollContent } from "@ionic/react";
import { alertCircleOutline, heartOutline } from "ionicons/icons";
import { useCallback, useState } from "react";

import { LeadCard } from "@/components/cards/LeadCard";
import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchBar } from "@/components/common/SearchBar";
import { SkeletonList } from "@/components/common/Skeletons";
import { LISTING_PAGE_SIZE } from "@/config/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fetchShortlistedLeads, leadBaseCategory } from "@/lib/api/leads";
import { fetchShortlistedProfessionals } from "@/lib/api/professionals";
import { LIST_GRID } from "@/lib/ui";
import type {
	DirectoryCategoryId,
	Lead,
	LeadCategoryId,
	ProfessionalListing,
} from "@/types";

const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/** Filter tabs shared by both saved panels. `key` matches the API `meta.counts`
 *  keys; `users`/`leads` are the per-entity category filter for that track. */
const SAVED_TABS: {
	key: string;
	label: string;
	users?: DirectoryCategoryId;
	leads?: LeadCategoryId;
}[] = [
	{ key: "all", label: "All" },
	{
		key: "professionals",
		label: "Professionals",
		users: "professionals",
		leads: "professional",
	},
	{
		key: "propertyDealers",
		label: "Property",
		users: "property-dealers",
		leads: "property",
	},
	{
		key: "materialSuppliers",
		label: "Materials",
		users: "material-suppliers",
		leads: "material",
	},
];

/** The `meta.counts` key for an item's track (drives the optimistic reconcile). */
function countKeyOf(
	entity: "users" | "leads",
	item: ProfessionalListing | Lead,
): string {
	if (entity === "leads") {
		const base = leadBaseCategory((item as Lead).category);
		if (base === "property") return "propertyDealers";
		if (base === "material") return "materialSuppliers";
		return "professionals";
	}
	const cat = (item as ProfessionalListing).category;
	if (cat === "property-dealers") return "propertyDealers";
	if (cat === "material-suppliers") return "materialSuppliers";
	return "professionals";
}

/**
 * Paged list of the signed-in user's shortlisted professionals or leads, with
 * track filter tabs + counts (P25/P29), search (P26/P30) and optimistic un-save
 * that reconciles the counts (P28). Pagination is infinite scroll.
 */
export function SavedList({ entity }: { entity: "users" | "leads" }) {
	const [activeKey, setActiveKey] = useState("all");
	const [search, setSearch] = useState("");
	const [counts, setCounts] = useState<Record<string, number>>({});

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) => {
			const tab = SAVED_TABS.find((t) => t.key === activeKey);
			const capture = <R extends { counts?: Record<string, number> }>(
				res: R,
			) => {
				if (page === 1) setCounts(res.counts ?? {});
				return res;
			};
			return entity === "users"
				? fetchShortlistedProfessionals(
						{
							category: tab?.users,
							search: search || undefined,
							page,
							limit: LISTING_PAGE_SIZE,
						},
						signal,
					).then(capture)
				: fetchShortlistedLeads(
						{
							category: tab?.leads,
							search: search || undefined,
							page,
							limit: LISTING_PAGE_SIZE,
						},
						signal,
					).then(capture);
		},
		[entity, activeKey, search],
	);

	const { items, status, hasMore, loadMore, removeItem } = usePagedList<
		ProfessionalListing | Lead
	>(fetcher, `${entity}|${activeKey}|${search}`);

	/** On un-save: drop the item and decrement its track + all counts (P28). */
	const onUnsave = (item: ProfessionalListing | Lead) => (saved: boolean) => {
		if (saved) return;
		removeItem((i) => i.id === item.id);
		const key = countKeyOf(entity, item);
		setCounts((c) => ({
			...c,
			all: Math.max(0, (c.all ?? 1) - 1),
			[key]: Math.max(0, (c[key] ?? 1) - 1),
		}));
	};

	return (
		<div className="-mx-4 bg-white px-4 pt-4">
			<SearchBar
				placeholder={
					entity === "users"
						? "Search saved professionals"
						: "Search saved leads"
				}
				onSearch={setSearch}
			/>

			<div
				className={`-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-0.5 ${HIDE_SCROLLBAR}`}
			>
				{SAVED_TABS.map((t) => {
					const active = t.key === activeKey;
					const count = counts[t.key];
					return (
						<button
							key={t.key}
							type="button"
							onClick={() => setActiveKey(t.key)}
							className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${
								active
									? "border-primary bg-primary text-white"
									: "border-line bg-white text-muted"
							}`}
						>
							{t.label}
							{count != null ? (
								<span
									className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold ${
										active
											? "bg-white/25 text-white"
											: "bg-surface-muted text-muted"
									}`}
								>
									{count}
								</span>
							) : null}
						</button>
					);
				})}
			</div>

			<div className="mt-3.5">
				{status === "loading" ? (
					<SkeletonList
						count={3}
						variant={entity === "users" ? "pro" : "lead"}
					/>
				) : status === "error" ? (
					<EmptyState
						icon={alertCircleOutline}
						message="Couldn't load your saved items. Pull down to retry."
					/>
				) : items.length === 0 ? (
					<EmptyState
						icon={heartOutline}
						message={
							entity === "users"
								? "No saved professionals here yet."
								: "No saved leads here yet."
						}
					/>
				) : (
					<div className={LIST_GRID}>
						{entity === "users"
							? (items as ProfessionalListing[]).map((pro) => (
									<ProfessionalCard
										key={pro.id}
										pro={pro}
										onSaveToggle={onUnsave(pro)}
										showTrackBadge
									/>
								))
							: (items as Lead[]).map((lead) => (
									<LeadCard
										key={lead.id}
										lead={lead}
										onSaveToggle={onUnsave(lead)}
									/>
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
		</div>
	);
}
