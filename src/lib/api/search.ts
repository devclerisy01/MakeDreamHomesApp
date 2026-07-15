import { apiGet } from "@/lib/api/client";

/** One directory-professional hit of the global search. */
export interface SearchUserHit {
	id: string;
	name: string;
	/** Directory bucket (`professionals` | `property-dealers` | `material-suppliers`). */
	category: string;
	profession: string;
	location: string;
}

/** One lead hit of the global search. */
export interface SearchLeadHit {
	id: string;
	title: string;
	/** Leads-tab id: `property` | `material` | `professional`. */
	category: string;
	location: string;
}

export interface GlobalSearchResult {
	users: SearchUserHit[];
	leads: SearchLeadHit[];
	/** Full match counts per group — drives the "View all" affordance. */
	totals: { users: number; leads: number; products: number };
}

/** The API caps `limit` at 20 per group. */
export const SEARCH_MAX_LIMIT = 20;
export const SEARCH_MIN_TERM = 2;

const EMPTY: GlobalSearchResult = {
	users: [],
	leads: [],
	totals: { users: 0, leads: 0, products: 0 },
};

/**
 * Global typeahead: up to `limit` hits per group (professionals / leads) plus the
 * full match counts, for a free-text term. Mirrors the web hero search. Fails
 * soft to an empty result (an aborted keystroke just yields empty).
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
			users: data.users ?? [],
			leads: data.leads ?? [],
			totals: data.totals ?? EMPTY.totals,
		};
	} catch {
		return EMPTY;
	}
}
