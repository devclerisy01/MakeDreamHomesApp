import { apiGet, apiPost } from "@/lib/api/client";

/** One portfolio image with a stable id (for cover selection). */
export interface PortfolioMediaItem {
	id: string;
	url: string;
	isCover: boolean;
}

/**
 * A professional's portfolio entry as returned by the app API. Images are
 * already resolved to loadable URLs server-side; `status` lets the owner's
 * profile badge items still awaiting moderation. Mirrors the web `PortfolioEntry`.
 */
export interface PortfolioEntry {
	id: string;
	title: string;
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
	address?: string;
	locality?: string;
	city?: string;
	state?: string;
	pincode?: string;
	photos: string[];
	/** Which photo key is the cover; defaults to the first. */
	coverPhoto?: string;
}

/** Create a portfolio entry for the signed-in professional (starts PENDING). */
export function createPortfolio(
	payload: CreatePortfolioPayload,
): Promise<PortfolioEntry> {
	return apiPost<PortfolioEntry>("/app/portfolio", payload, { auth: true });
}

/** The signed-in professional's own portfolio (all statuses, newest first). */
export function getMyPortfolio(
	signal?: AbortSignal,
): Promise<PortfolioEntry[]> {
	return apiGet<PortfolioEntry[]>("/app/portfolio/me", { auth: true, signal });
}
