import { apiGet, apiPost } from "@/lib/api/client";

/**
 * Reviews API — a signed-in user reviewing another user. Mirrors the web
 * (`professionals.service.ts`). The overall rating is derived server-side from
 * the five category ratings; the API forces the review to PENDING.
 */

/** Body for `POST /app/reviews`. `reviewForId` is the target user's id. */
export interface SubmitReviewInput {
	reviewForId: string;
	price: number;
	quality: number;
	behaviour: number;
	timeliness: number;
	communication: number;
	comment?: string;
}

/** Submit a review (creates a PENDING review). Success/errors toast centrally. */
export function submitReview(input: SubmitReviewInput): Promise<unknown> {
	return apiPost("/app/reviews", input, { auth: true });
}

/** Whether the signed-in user has already reviewed the target (any status). */
export async function hasReviewed(reviewForId: string): Promise<boolean> {
	const data = await apiGet<{ reviewed: boolean }>(
		`/app/reviews/status/${reviewForId}`,
		{ auth: true },
	);
	return data.reviewed;
}
