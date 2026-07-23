import type { ReactNode } from "react";
import { useTranslations } from "use-intl";

import { Stars } from "@/components/common/Stars";
import { REVIEW_SUB_CATEGORIES } from "@/constants/reviews";
import { CARD } from "@/lib/ui";
import type { ReviewsBreakdown } from "@/types";

interface RatingBreakdownProps {
	breakdown: ReviewsBreakdown;
	count?: number;
	/** Optional trailing action rendered beside the card title (e.g. "Write a Review"). */
	action?: ReactNode;
}

/** "Rating & Reviews" card: overall score + the four sub-category rows. */
export function RatingBreakdown({
	breakdown,
	count,
	action,
}: RatingBreakdownProps) {
	const translate = useTranslations();
	return (
		<section className={`p-4 ${CARD}`}>
			<div className="mb-2 flex items-center justify-between gap-2">
				<div className="flex flex-col">
					<h2 className="m-0 text-[15px] font-bold text-ink">
						{translate("professional.ratingReviews")}
					</h2>
					<div className="mb-4 flex items-center gap-2.5">
						<Stars value={breakdown.average} size="lg" />
						<span className="text-[20px] font-bold text-ink">
							{breakdown.average.toFixed(1)}
						</span>
						{count ? (
							<span className="text-sm text-muted-light">({count})</span>
						) : null}
					</div>
				</div>
				{action}
			</div>

			<div className="flex flex-col gap-[8px]">
				{REVIEW_SUB_CATEGORIES.map((cat) => (
					<div
						key={cat.key}
						className="flex items-center justify-between gap-2.5"
					>
						<span className="inline-flex items-center gap-2 text-[13px] text-ink">
							<span className="text-[15px]">{cat.icon}</span>
							{translate(cat.labelKey)}
						</span>
						<Stars value={breakdown[cat.key]} />
					</div>
				))}
			</div>
		</section>
	);
}
