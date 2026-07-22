import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";

/** One portfolio image with a stable id (for cover/remove on edit). */
export interface PortfolioMediaItem {
	id: string;
	url: string;
	isCover: boolean;
}

/**
 * A professional's portfolio entry as returned by the app API. Images are
 * already resolved to loadable URLs server-side; `status` lets the owner's
 * profile badge items still awaiting approval. Mirrors the web `PortfolioEntry`.
 * `title` is nullable (professional portfolios can have no title).
 */
export interface PortfolioEntry {
	id: string;
	title: string | null;
	description: string | null;
	category: string | null;
	address: string | null;
	locality: string | null;
	city: string | null;
	state: string | null;
	pincode: string | null;
	status: "PENDING" | "APPROVED" | "DELETED";
	coverImage: string | null;
	media: PortfolioMediaItem[];
	createdAt: string;
}

/**
 * Payload for creating a portfolio entry. `photos` are storage keys from the
 * presigned upload flow (see {@link uploadImageViaPresign}).
 */
export interface CreatePortfolioPayload {
	title: string;
	description?: string;
	category?: string;
	address?: string;
	locality?: string;
	city?: string;
	state?: string;
	pincode?: string;
	photos: string[];
	/** Which photo key is the cover; defaults to the first. */
	coverPhoto?: string;
}

/** Payload for editing a portfolio entry. Only changed fields need be sent. */
export interface UpdatePortfolioPayload {
	title?: string;
	description?: string;
	category?: string;
	address?: string;
	locality?: string;
	city?: string;
	state?: string;
	pincode?: string;
	/** NEW image keys to append (from the presigned upload flow). */
	photos?: string[];
	/** Existing media ids to remove. */
	deletedImageIds?: string[];
	/** Existing media id to mark as cover. */
	coverImageId?: string;
	/** A newly-added key (from `photos`) to mark as cover. */
	coverPhoto?: string;
}

/** Create a portfolio entry for the signed-in professional (starts PENDING). */
export function createPortfolio(
	payload: CreatePortfolioPayload,
): Promise<PortfolioEntry> {
	return apiPost<PortfolioEntry>("/app/portfolio", payload, { auth: true });
}

/** Edit one of the signed-in professional's portfolio entries (re-enters PENDING). */
export function updatePortfolio(
	id: string,
	payload: UpdatePortfolioPayload,
): Promise<PortfolioEntry> {
	return apiPatch<PortfolioEntry>(`/app/portfolio/${id}`, payload);
}

/** The signed-in professional's own portfolio (all statuses, newest first). */
export function getMyPortfolio(
	signal?: AbortSignal,
): Promise<PortfolioEntry[]> {
	return apiGet<PortfolioEntry[]>("/app/portfolio/me", { auth: true, signal });
}

/** Delete one of the signed-in professional's portfolio entries. */
export function deletePortfolio(id: string): Promise<unknown> {
	return apiDelete<unknown>(`/app/portfolio/${id}`);
}

/**
 * Full (resolved) image set for a public portfolio/product entry
 * (`GET /app/users/portfolio/:id/images`). Backs the detail-page gallery for
 * professional/dealer portfolios, which carry only a cover on the card. Fails
 * soft to an empty list.
 */
export async function fetchPortfolioImages(
	id: string,
	signal?: AbortSignal,
): Promise<string[]> {
	try {
		const data = await apiGet<{ images?: string[] }>(
			`/app/users/portfolio/${id}/images`,
			{ signal },
		);
		return data?.images ?? [];
	} catch {
		return [];
	}
}
