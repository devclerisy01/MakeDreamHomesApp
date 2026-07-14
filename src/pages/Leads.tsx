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
	useIonToast,
} from "@ionic/react";
import {
	alertCircleOutline,
	documentTextOutline,
	optionsOutline,
} from "ionicons/icons";
import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { LeadCard } from "@/components/cards/LeadCard";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchBar } from "@/components/common/SearchBar";
import { SkeletonList } from "@/components/common/Skeletons";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { LISTING_PAGE_SIZE } from "@/config/api";
import { DEFAULT_LEAD_CATEGORY, LEAD_TABS } from "@/constants/categories";
import { decodeProfessionalId } from "@/constants/routes";
import { getLeads } from "@/lib/api/leads";
import { usePagedList } from "@/hooks/usePagedList";
import { LIST_GRID } from "@/lib/ui";
import type { LeadCategoryId } from "@/types";

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

	const [category, setCategory] = useState<LeadCategoryId>(
		DEFAULT_LEAD_CATEGORY,
	);
	const [search, setSearch] = useState("");
	const [present] = useIonToast();

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			getLeads(
				{ category, search, userId, page, limit: LISTING_PAGE_SIZE },
				signal,
			),
		[category, search, userId],
	);
	const { items, status, hasMore, loadMore, reload } = usePagedList(
		fetcher,
		`${category}|${search}|${userId ?? ""}`,
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
					<SearchBar onSearch={setSearch} />
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
								message="No requirements posted yet."
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
						onClick={() =>
							void present({
								message: "Filters are coming soon.",
								duration: 1600,
								position: "bottom",
							})
						}
					>
						<IonIcon icon={optionsOutline} />
					</IonFabButton>
				</IonFab>
			</IonContent>
		</IonPage>
	);
}
