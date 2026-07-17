/**
 * The five review sub-categories, in display order — shared by the
 * "Rating & Reviews" breakdown and the write-review form. `key` maps to the
 * numeric field on a `ReviewsBreakdown` / review; `icon` is the emoji shown
 * beside each row. Mirrors the web's `constants/reviews.ts` (English labels).
 */
export const REVIEW_SUB_CATEGORIES = [
	{ key: "quality", icon: "🏠", label: "Quality of Work" },
	{ key: "behaviour", icon: "💬", label: "Behaviour & Communication" },
	{ key: "timeliness", icon: "⏱️", label: "Timeliness" },
	{ key: "communication", icon: "📋", label: "Transparency & Honesty" },
] as const;

/** A numeric rating field key on a review / breakdown (`quality`, `price`, …). */
export type ReviewCategoryKey = (typeof REVIEW_SUB_CATEGORIES)[number]["key"];
