import { LISTING_PAGE_SIZE } from "@/config/api";
import { apiGetEnvelope } from "@/lib/api/client";
import type { Lead, LeadCategoryId } from "@/types";

export interface LeadsQuery {
	category?: string;
	page?: number;
	limit?: number;
	search?: string;
	sort?: string;
	lat?: number;
	lng?: number;
	radius?: number;
	/** Decoded professional id to scope leads to (from `?userId=`). */
	userId?: string;
}

export interface LeadsPage {
	items: Lead[];
	totalPages: number;
	totalItems: number;
}

function buildLeadsParams(query: LeadsQuery): URLSearchParams {
	const params = new URLSearchParams({
		page: String(query.page ?? 1),
		limit: String(query.limit ?? LISTING_PAGE_SIZE),
	});

	if (query.category) params.set("category", query.category);
	const search = query.search?.trim();
	if (search) params.set("search", search);

	if (query.sort === "nearest" && query.lat != null && query.lng != null) {
		params.set("sortBy", "distance");
		params.set("lat", String(query.lat));
		params.set("lng", String(query.lng));
	} else {
		params.set("sortBy", "createdAt");
		params.set("sortOrder", "DESC");
	}

	if (query.radius != null && query.lat != null && query.lng != null) {
		params.set("lat", String(query.lat));
		params.set("lng", String(query.lng));
		params.set("radius", String(query.radius));
	}

	if (query.userId?.trim()) params.set("userId", query.userId.trim());
	return params;
}

async function fetchLeadsPage(
	basePath: string,
	query: LeadsQuery,
	auth: boolean,
	signal?: AbortSignal,
): Promise<LeadsPage> {
	const params = buildLeadsParams(query);
	const { data, meta } = await apiGetEnvelope<Lead[]>(
		`${basePath}?${params.toString()}`,
		{ auth, signal },
	);
	return {
		items: data ?? [],
		totalPages: meta?.totalPages ?? 0,
		totalItems: meta?.total ?? 0,
	};
}

/** One page of the public leads feed. */
export function getLeads(
	query: LeadsQuery = {},
	signal?: AbortSignal,
): Promise<LeadsPage> {
	return fetchLeadsPage("/app/leads", query, false, signal);
}

/** One page of the signed-in user's shortlisted leads (auth). */
export function fetchShortlistedLeads(
	query: LeadsQuery = {},
	signal?: AbortSignal,
): Promise<LeadsPage> {
	return fetchLeadsPage("/app/shortlists/leads", query, true, signal);
}

/** Buy/sell intent derived from the raw category (`buy_property` → "buy"). */
export function leadIntent(category: string): "buy" | "sell" | null {
	const c = category.toLowerCase();
	if (c.startsWith("buy")) return "buy";
	if (c.startsWith("sell")) return "sell";
	return null;
}

/** Base track derived from the raw category. */
export function leadBaseCategory(category: string): LeadCategoryId {
	const c = category.toLowerCase();
	if (c.includes("property")) return "property";
	if (c.includes("material")) return "material";
	return "professional";
}
