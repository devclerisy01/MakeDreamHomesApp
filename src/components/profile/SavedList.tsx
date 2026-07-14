import { IonInfiniteScroll, IonInfiniteScrollContent } from "@ionic/react";
import { alertCircleOutline, heartOutline } from "ionicons/icons";
import { useCallback } from "react";

import { LeadCard } from "@/components/cards/LeadCard";
import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonList } from "@/components/common/Skeletons";
import { LISTING_PAGE_SIZE } from "@/config/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fetchShortlistedLeads } from "@/lib/api/leads";
import { fetchShortlistedProfessionals } from "@/lib/api/professionals";
import { LIST_GRID } from "@/lib/ui";
import type { Lead, ProfessionalListing } from "@/types";

/**
 * Paged list of the signed-in user's shortlisted professionals or leads, used
 * by the Profile "Saved" tabs. Unsaving an item removes it from the list.
 */
export function SavedList({ entity }: { entity: "users" | "leads" }) {
	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			entity === "users"
				? fetchShortlistedProfessionals(
						{ page, limit: LISTING_PAGE_SIZE },
						signal,
					)
				: fetchShortlistedLeads({ page, limit: LISTING_PAGE_SIZE }, signal),
		[entity],
	);
	const { items, status, hasMore, loadMore, removeItem } = usePagedList<
		ProfessionalListing | Lead
	>(fetcher, entity);

	const removeById = (id: string) => (saved: boolean) => {
		if (!saved) removeItem((item) => item.id === id);
	};

	return (
		<div className="mt-3.5">
			{status === "loading" ? (
				<SkeletonList count={3} variant={entity === "users" ? "pro" : "lead"} />
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
							? "No saved professionals yet."
							: "No saved requirements yet."
					}
				/>
			) : (
				<div className={LIST_GRID}>
					{entity === "users"
						? (items as ProfessionalListing[]).map((pro) => (
								<ProfessionalCard
									key={pro.id}
									pro={pro}
									onSaveToggle={removeById(pro.id)}
								/>
							))
						: (items as Lead[]).map((lead) => (
								<LeadCard
									key={lead.id}
									lead={lead}
									onSaveToggle={removeById(lead.id)}
								/>
							))}
				</div>
			)}

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
