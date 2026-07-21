import { apiGet } from "@/lib/api/client";

/**
 * One directory hit of the hero typeahead. Professionals and leads share this
 * single shape — `type` tells them apart and drives the icon/navigation;
 * `profession` and `matches` are only present for professionals. This mirrors
 * the web app + the NestJS `/app/search` response exactly.
 */
export interface SearchResultItem {
	id: string;
	type: "professional" | "lead";
	title: string;
	/** Directory bucket (`professionals` | `property-dealers` | `material-suppliers`) or a leads-tab id (`property` | `material` | `professional`). */
	category: string;
	location: string;
	/** The pro's trade — professionals only. */
	profession?: string;
	/** Names of the catalogue rows that matched — the "why it matched" detail. */
	matches?: string[];
}

export interface GlobalSearchResult {
	/** Professionals and leads combined into one uniformly-shaped list. */
	results: SearchResultItem[];
	/** Total matched rows for the active search — drives "Load more" / "View all". */
	count: number;
}

/** The API caps `limit` at 20 per group. */
export const SEARCH_MAX_LIMIT = 20;
export const SEARCH_MIN_TERM = 2;

const EMPTY: GlobalSearchResult = {
	results: [],
	count: 0,
};

/**
 * Global typeahead: up to `limit` hits (professionals or leads, depending on
 * `category`) plus the full match count, for a free-text term. Mirrors the web
 * hero search. Fails soft to an empty result (an aborted keystroke just yields
 * empty).
 */
export async function globalSearch(
	q: string,
	limit = 5,
	category = "all",
	signal?: AbortSignal,
): Promise<GlobalSearchResult> {
	const term = q.trim().slice(0, 100);
	if (term.length < SEARCH_MIN_TERM) return EMPTY;
	try {
		const capped = Math.min(Math.max(limit, 1), SEARCH_MAX_LIMIT);
		const params = new URLSearchParams({
			q: term,
			limit: String(capped),
			category,
		});
		const data = await apiGet<Partial<GlobalSearchResult>>(
			`/app/search?${params.toString()}`,
			{ signal },
		);
		return {
			results: data.results ?? [],
			count: data.count ?? 0,
		};
	} catch {
		return EMPTY;
	}
}
