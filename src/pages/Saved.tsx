import {
	IonContent,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	useIonRouter,
} from "@ionic/react";
import { alertCircleOutline, heartOutline } from "ionicons/icons";
import { useCallback, useState } from "react";

import { LeadCard } from "@/components/cards/LeadCard";
import { ProfessionalCard } from "@/components/cards/ProfessionalCard";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonList } from "@/components/common/Skeletons";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { LISTING_PAGE_SIZE } from "@/config/api";
import { ROUTES } from "@/constants/routes";
import { usePagedList } from "@/hooks/usePagedList";
import { fetchShortlistedLeads } from "@/lib/api/leads";
import { fetchShortlistedProfessionals } from "@/lib/api/professionals";
import { useAuth } from "@/lib/auth/session";
import { LIST_GRID } from "@/lib/ui";
import type { Lead, ProfessionalListing } from "@/types";

type Segment = "users" | "leads";

const SEGMENTS: { id: Segment; label: string }[] = [
	{ id: "users", label: "Professionals" },
	{ id: "leads", label: "Requirements" },
];

export default function Saved() {
	const router = useIonRouter();
	const { isAuthed } = useAuth();
	const [segment, setSegment] = useState<Segment>("users");

	const fetcher = useCallback(
		(page: number, signal: AbortSignal) =>
			segment === "users"
				? fetchShortlistedProfessionals(
						{ page, limit: LISTING_PAGE_SIZE },
						signal,
					)
				: fetchShortlistedLeads({ page, limit: LISTING_PAGE_SIZE }, signal),
		[segment],
	);
	const { items, status, hasMore, loadMore, reload, removeItem } = usePagedList<
		ProfessionalListing | Lead
	>(fetcher, segment);

	if (!isAuthed) {
		return (
			<IonPage>
				<AppHeader title="Saved" back />
				<IonContent>
					<Container>
						<div className="mt-6 flex flex-col items-center px-6 py-10 text-center">
							<span className="grid h-20 w-20 place-items-center rounded-full bg-primary-light text-primary">
								<IonIcon icon={heartOutline} className="text-4xl" />
							</span>
							<h2 className="mt-4 text-lg font-extrabold text-ink">
								Sign in to see your saved items
							</h2>
							<p className="mt-1.5 max-w-[300px] text-sm text-muted-light">
								Save professionals and requirements to find them again here.
							</p>
							<button
								type="button"
								onClick={() => router.push(ROUTES.login, "forward", "push")}
								className="mt-6 w-full max-w-[320px] rounded-xl bg-primary py-3.5 text-[15px] font-bold text-white active:opacity-90"
							>
								Sign in
							</button>
						</div>
					</Container>
				</IonContent>
			</IonPage>
		);
	}

	const removeById = (id: string) => (saved: boolean) => {
		if (!saved) removeItem((item) => item.id === id);
	};

	return (
		<IonPage>
			<AppHeader title="Saved" back />
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
					<CategoryTabs
						tabs={SEGMENTS}
						active={segment}
						onChange={setSegment}
					/>

					<div className="mt-3.5">
						{status === "loading" ? (
							<SkeletonList
								count={4}
								variant={segment === "users" ? "pro" : "lead"}
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
									segment === "users"
										? "No saved professionals yet."
										: "No saved requirements yet."
								}
							/>
						) : (
							<div className={LIST_GRID}>
								{segment === "users"
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
			</IonContent>
		</IonPage>
	);
}
