import { Stars } from "@/components/common/Stars";
import { REVIEW_SUB_CATEGORIES } from "@/constants/reviews";
import { CARD } from "@/lib/ui";
import type { ReviewsBreakdown } from "@/types";

interface RatingBreakdownProps {
	breakdown: ReviewsBreakdown;
	count?: number;
}

/** "Rating & Reviews" card: overall score + the four sub-category rows. */
export function RatingBreakdown({ breakdown, count }: RatingBreakdownProps) {
	return (
		<section className={`p-4 ${CARD}`}>
			<h2 className="m-0 mb-3 text-base font-extrabold text-ink">
				Rating &amp; Reviews
			</h2>
			<div className="mb-4 flex items-center gap-2.5">
				<Stars value={breakdown.average} size="lg" />
				<span className="text-[22px] font-extrabold text-ink">
					{breakdown.average.toFixed(1)}
				</span>
				{count ? (
					<span className="text-sm text-muted-light">({count})</span>
				) : null}
			</div>
			<div className="flex flex-col gap-[13px]">
				{REVIEW_SUB_CATEGORIES.map((cat) => (
					<div
						key={cat.key}
						className="flex items-center justify-between gap-2.5"
					>
						<span className="inline-flex items-center gap-2 text-[13.5px] text-muted">
							<span className="text-[15px]">{cat.icon}</span>
							{cat.label}
						</span>
						<Stars value={breakdown[cat.key]} />
					</div>
				))}
			</div>
		</section>
	);
}
