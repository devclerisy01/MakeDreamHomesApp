/**
 * The five review sub-categories, in display order — shared by the
 * "Rating & Reviews" breakdown, the individual review cards, and the
 * write-review form. `key` maps to the numeric field on a `ReviewsBreakdown` /
 * review; `icon` is the emoji shown beside each row; `label` is the full form
 * label; `desc` is the form subtitle; `shortLabel` is the compact label used on
 * the per-review breakdown bars. Mirrors the web's `constants/reviews.ts`.
 */
export const REVIEW_SUB_CATEGORIES = [
	{
		key: "quality",
		icon: "🏠",
		label: "Quality of Work",
		desc: "How would you rate the quality of the work delivered?",
		shortLabel: "Quality",
	},
	{
		key: "behaviour",
		icon: "💬",
		label: "Behaviour",
		desc: "How would you rate their behaviour and professionalism?",
		shortLabel: "Behaviour",
	},
	{
		key: "timeliness",
		icon: "⏱️",
		label: "Timeliness",
		desc: "How well did they meet the agreed timeliness?",
		shortLabel: "Timeliness",
	},
	{
		key: "communication",
		icon: "📋",
		label: "Communication",
		desc: "How would you rate their communication and responsiveness?",
		shortLabel: "Communication",
	},
	{
		key: "price",
		icon: "💰",
		label: "Price",
		desc: "How would you rate their pricing and value for money?",
		shortLabel: "Price",
	},
] as const;

/** A numeric rating field key on a review / breakdown (`quality`, `price`, …). */
export type ReviewCategoryKey = (typeof REVIEW_SUB_CATEGORIES)[number]["key"];
