/**
 * The five review sub-categories, in display order — shared by the
 * "Rating & Reviews" breakdown, the individual review cards, and the
 * write-review form. `key` maps to the numeric field on a `ReviewsBreakdown` /
 * review; `icon` is the emoji shown beside each row; `labelKey`/`descKey` are
 * the use-intl keys for the full form label + subtitle; `shortKey` is the
 * compact label used on the per-review breakdown bars. Text lives in the DB
 * catalogue (professional.review*), so the app stays in sync with the web.
 */
export const REVIEW_SUB_CATEGORIES = [
	{
		key: "quality",
		icon: "🏠",
		labelKey: "professional.reviewQualityLabel",
		descKey: "professional.reviewQualityDesc",
		shortKey: "professional.reviewQualityShort",
	},
	{
		key: "behaviour",
		icon: "💬",
		labelKey: "professional.reviewBehaviourLabel",
		descKey: "professional.reviewBehaviourDesc",
		shortKey: "professional.reviewBehaviourShort",
	},
	{
		key: "timeliness",
		icon: "⏱️",
		labelKey: "professional.reviewTimelinesLabel",
		descKey: "professional.reviewTimelinesDesc",
		shortKey: "professional.reviewTimelinesShort",
	},
	{
		key: "communication",
		icon: "📋",
		labelKey: "professional.reviewTransparencyLabel",
		descKey: "professional.reviewTransparencyDesc",
		shortKey: "professional.reviewTransparencyShort",
	},
	{
		key: "price",
		icon: "💰",
		labelKey: "professional.reviewPriceLabel",
		descKey: "professional.reviewPriceDesc",
		shortKey: "professional.reviewPriceShort",
	},
] as const;

/** A numeric rating field key on a review / breakdown (`quality`, `price`, …). */
export type ReviewCategoryKey = (typeof REVIEW_SUB_CATEGORIES)[number]["key"];
