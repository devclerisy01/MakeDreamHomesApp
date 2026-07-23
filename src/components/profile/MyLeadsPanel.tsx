import { IonInfiniteScroll, IonInfiniteScrollContent } from "@ionic/react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { SearchBar } from "@/components/common/SearchBar";
import { SkeletonList } from "@/components/common/Skeletons";
import { EditLeadModal } from "@/components/profile/EditLeadModal";
import { MyLeadCard } from "@/components/profile/MyLeadCard";
import { LISTING_PAGE_SIZE } from "@/config/api";
import { usePagedList } from "@/hooks/usePagedList";
import { getMyLeads } from "@/lib/api/leads";
import {
	type CategoryOption,
	getMaterialCategories,
	getProfessionalCategories,
} from "@/lib/api/misc";
import { ICONS } from "@/theme/icons";
import type { Lead, LeadCategoryId } from "@/types";

type Audience = "all" | LeadCategoryId;

const AUDIENCE_TABS: { id: Audience; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "professional", label: "For Professionals" },
	{ id: "property", label: "For Property Dealers" },
	{ id: "material", label: "For Material Suppliers" },
];

const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * The signed-in user's posted requirements (P2): audience tabs with counts
 * (P20), subcategory chips for the professional/material tracks (P21), search
 * (P22), infinite pagination (P23) and an in-place edit sheet (P24).
 */
export function MyLeadsPanel() {
	const [audience, setAudience] = useState<Audience>("all");
	const [search, setSearch] = useState("");
	const [subcategory, setSubcategory] = useState<string | null>(null);
	const [counts, setCounts] = useState<Record<string, number>>({});
	const [subOptions, setSubOptions] = useState<CategoryOption[]>([]);
	const [editLead, setEditLead] = useState<Lead | null>(null);

	// Subcategory chip options — professional trades / supplier products (P21).
	useEffect(() => {
		setSubcategory(null);
		const loader =
			audience === "professional"
				? getProfessionalCategories
				: audience === "material"
					? getMaterialCategories
					: null;
		if (!loader) {
			setSubOptions([]);
			return;
		}
		const controller = new AbortController();
		loader(controller.signal)
			.then(setSubOptions)
			.catch(() => {});
		return () => controller.abort();
	}, [audience]);

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			getMyLeads(
				{
					category: audience === "all" ? undefined : audience,
					subcategory: subcategory ?? undefined,
					search: search || undefined,
					page,
					limit: LISTING_PAGE_SIZE,
				},
				signal,
			).then((res) => {
				// Per-audience counts are the same for every tab (scoped by search).
				if (page === 1) setCounts(res.counts ?? {});
				return res;
			}),
		[audience, subcategory, search],
	);
	const { items, status, hasMore, loadMore, updateItem } = usePagedList<Lead>(
		fetcher,
		`${audience}|${subcategory ?? ""}|${search}`,
	);

	return (
		<div className="-mx-4 bg-white px-4 pt-4">
			<SearchBar placeholder="Search your leads" onSearch={setSearch} />

			<div
				className={`-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-0.5 ${HIDE_SCROLLBAR}`}
			>
				{AUDIENCE_TABS.map((t) => {
					const active = t.id === audience;
					const count = counts[t.id];
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => setAudience(t.id)}
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

			{subOptions.length ? (
				<div
					className={`-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5 ${HIDE_SCROLLBAR}`}
				>
					<SubChip
						label="All"
						active={subcategory === null}
						onClick={() => setSubcategory(null)}
					/>
					{subOptions.map((o) => (
						<SubChip
							key={o.id}
							label={o.value}
							active={subcategory === o.value}
							onClick={() => setSubcategory(o.value)}
						/>
					))}
				</div>
			) : null}

			<div className="mt-3.5">
				{status === "loading" ? (
					<SkeletonList count={3} variant="lead" />
				) : status === "error" ? (
					<EmptyState
						icon={ICONS.alert}
						message="Couldn't load your leads. Pull down to retry."
					/>
				) : items.length === 0 ? (
					<EmptyState
						icon={ICONS.lead}
						message="You haven't posted any leads yet."
					/>
				) : (
					<div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
						{items.map((lead) => (
							<MyLeadCard
								key={lead.id}
								lead={lead}
								onEdit={() => setEditLead(lead)}
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

			<EditLeadModal
				lead={editLead}
				isOpen={editLead !== null}
				onClose={() => setEditLead(null)}
				onSaved={(updated) =>
					updateItem(
						(l) => l.id === updated.id,
						() => updated,
					)
				}
			/>
		</div>
	);
}

function SubChip({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-medium ${
				active
					? "border-primary bg-primary-light text-primary"
					: "border-line bg-white text-muted"
			}`}
		>
			{label}
		</button>
	);
}
