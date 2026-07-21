import { apiGet, apiGetEnvelope, apiPost } from "@/lib/api/client";
import type { ProfessionalReview } from "@/types";

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

/**
 * A page of a professional's published reviews. The detail endpoint embeds only
 * the first page; deeper pages come from here (public, mirrors the web). Fails
 * soft to an empty page.
 */
export async function fetchUserReviews(
	userId: string,
	page: number,
	limit = 4,
	signal?: AbortSignal,
): Promise<{ items: ProfessionalReview[]; totalPages: number }> {
	try {
		const params = new URLSearchParams({
			page: String(page),
			limit: String(limit),
		});
		const { data, meta } = await apiGetEnvelope<ProfessionalReview[]>(
			`/app/users/${userId}/reviews?${params.toString()}`,
			{ signal },
		);
		return { items: data ?? [], totalPages: meta?.totalPages ?? 0 };
	} catch {
		return { items: [], totalPages: 0 };
	}
}

/** Whether the signed-in user has already reviewed the target (any status). */
export async function hasReviewed(reviewForId: string): Promise<boolean> {
	const data = await apiGet<{ reviewed: boolean }>(
		`/app/reviews/status/${reviewForId}`,
		{ auth: true },
	);
	return data.reviewed;
}
