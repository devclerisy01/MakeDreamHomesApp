/**
 * The four review sub-categories, in display order — shared by the
 * "Rating & Reviews" breakdown. `key` maps to the numeric field on a
 * `ReviewsBreakdown`; `icon` is the emoji shown beside each row.
 */
export const REVIEW_SUB_CATEGORIES = [
	{ key: "qualityOfWork", icon: "🛠️", label: "Quality of Work" },
	{
		key: "behaviourCommunication",
		icon: "💬",
		label: "Behaviour & Communication",
	},
	{ key: "timeliness", icon: "⏱️", label: "Timeliness" },
	{ key: "transparencyHonesty", icon: "📋", label: "Transparency & Honesty" },
] as const;
