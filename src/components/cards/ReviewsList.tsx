import { IonIcon } from "@ionic/react";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";

import { ReviewCardSkeleton } from "@/components/common/Skeletons";
import { Stars } from "@/components/common/Stars";
import { REVIEW_SUB_CATEGORIES } from "@/constants/reviews";
import { fetchUserReviews } from "@/lib/api/reviews";
import { timeAgo } from "@/lib/format";
import { CARD, SECTION_HEAD, SECTION_TITLE } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type { ProfessionalReview } from "@/types";

/** Aligns with the API page size. */
const PER_PAGE = 4;

/** Two-letter initials for a reviewer's avatar chip. */
function initialsOf(name: string): string {
	return (
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? "")
			.join("") || "U"
	);
}

/** One reviewer's card: identity, comment, relative time + sub-category bars. */
function ReviewCard({ review }: { review: ProfessionalReview }) {
	const translate = useTranslations();
	return (
		<article className={`p-4 ${CARD}`}>
			<div className="flex items-center gap-3">
				<span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">
					{initialsOf(review.author)}
				</span>
				<div className="flex min-w-0 flex-col">
					<span className="truncate text-sm font-bold leading-tight text-ink">
						{review.author}
					</span>
					<span className="mt-0.5 flex items-center gap-1.5">
						<Stars value={review.rating} />
						<span className="text-[11px] font-bold text-ink">
							{review.rating.toFixed(1)}
						</span>
					</span>
				</div>
			</div>

			<p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink">
				{review.comment ? (
					review.comment
				) : (
					<span className="italic text-muted-light">
						{translate("profile.noComment")}
					</span>
				)}
			</p>

			{review.createdAt ? (
				<div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-muted-light">
					<IonIcon icon={ICONS.time} className="text-[13px]" />
					<span>{timeAgo(review.createdAt)}</span>
				</div>
			) : null}

			<div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-primary/10 bg-primary-light/40 p-2.5">
				{REVIEW_SUB_CATEGORIES.map((cat) => {
					const score = review[cat.key];
					if (score === undefined || score === null) return null;
					const percentage = (Number(score) / 5) * 100;
					return (
						<div
							key={cat.key}
							className="flex items-center gap-2 text-[11px] font-semibold"
						>
							<span className="w-[92px] shrink-0 truncate text-muted">
								{translate(cat.shortKey)}
							</span>
							<span className="h-[5px] flex-1 overflow-hidden rounded-full bg-primary/10">
								<span
									className="block h-full rounded-full bg-primary"
									style={{ width: `${percentage}%` }}
								/>
							</span>
							<span className="w-6 shrink-0 text-right font-extrabold text-ink">
								{Number(score).toFixed(1)}
							</span>
						</div>
					);
				})}
			</div>
		</article>
	);
}

/**
 * Individual written reviews for a professional, with 4-per-page pagination.
 * Page 1 uses the reviews already embedded in the detail payload; deeper pages
 * are fetched on demand. Mirrors the web's reviews section.
 */
export function ReviewsList({
	userId,
	initialReviews,
	total,
}: {
	userId: string;
	initialReviews: ProfessionalReview[];
	total: number;
}) {
	const translate = useTranslations();
	const [page, setPage] = useState(1);
	const [items, setItems] = useState<ProfessionalReview[]>(initialReviews);
	const [loading, setLoading] = useState(false);
	const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

	// Reset when the professional (or their first page) changes.
	useEffect(() => {
		setPage(1);
		setItems(initialReviews);
		setLoading(false);
	}, [userId, initialReviews]);

	function goToPage(next: number) {
		if (next === page || loading || next < 1 || next > totalPages) return;
		if (next === 1) {
			setItems(initialReviews);
			setPage(1);
			return;
		}
		setLoading(true);
		fetchUserReviews(userId, next, PER_PAGE)
			.then((res) => {
				setItems(res.items);
				setPage(next);
			})
			.finally(() => setLoading(false));
	}

	return (
		<section>
			<div className={SECTION_HEAD}>
				<h2 className={SECTION_TITLE}>
					{translate("common.reviews")}
					<span className="ml-2 inline-flex min-w-[22px] items-center justify-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-bold text-muted">
						{total}
					</span>
				</h2>
			</div>

			<div className="mt-3 flex flex-col gap-3">
				{loading
					? Array.from({ length: PER_PAGE }, (_, i) => (
							<ReviewCardSkeleton key={i} />
						))
					: items.map((review) => (
							<ReviewCard key={review.id} review={review} />
						))}
			</div>

			{totalPages > 1 ? (
				<div className="mt-3.5 flex items-center justify-center gap-4">
					<button
						type="button"
						aria-label={translate("mobile.common.previousPage")}
						disabled={page <= 1 || loading}
						onClick={() => goToPage(page - 1)}
						className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink disabled:opacity-40"
					>
						<IonIcon icon={ICONS.back} />
					</button>
					<span className="text-[13px] font-semibold text-muted">
						Page {page} of {totalPages}
					</span>
					<button
						type="button"
						aria-label={translate("mobile.common.nextPage")}
						disabled={page >= totalPages || loading}
						onClick={() => goToPage(page + 1)}
						className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink disabled:opacity-40"
					>
						<IonIcon icon={ICONS.chevronForward} />
					</button>
				</div>
			) : null}
		</section>
	);
}
