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
	optionsOutline,
	peopleOutline,
} from "ionicons/icons";
import { useCallback, useState } from "react";

import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchBar } from "@/components/common/SearchBar";
import { SkeletonList } from "@/components/common/Skeletons";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { LISTING_PAGE_SIZE } from "@/config/api";
import {
	DEFAULT_DIRECTORY_CATEGORY,
	DIRECTORY_TABS,
} from "@/constants/categories";
import { fetchProfessionals } from "@/lib/api/professionals";
import { usePagedList } from "@/hooks/usePagedList";
import { LIST_GRID } from "@/lib/ui";
import type { DirectoryCategoryId } from "@/types";

export default function Professionals() {
	const [category, setCategory] = useState<DirectoryCategoryId>(
		DEFAULT_DIRECTORY_CATEGORY,
	);
	const [search, setSearch] = useState("");
	const [present] = useIonToast();

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			fetchProfessionals(
				{ category, search, page, limit: LISTING_PAGE_SIZE },
				signal,
			),
		[category, search],
	);
	const { items, status, hasMore, loadMore, reload } = usePagedList(
		fetcher,
		`${category}|${search}`,
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
					<SearchBar onSearch={setSearch} />
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
								message="No professionals match your search."
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
