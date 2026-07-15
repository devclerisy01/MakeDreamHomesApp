import { LISTING_PAGE_SIZE } from "@/config/api";
import { apiGet, apiGetEnvelope, apiPost } from "@/lib/api/client";
import type { LocationFacet } from "@/lib/api/professionals";
import { uploadImageViaPresign } from "@/lib/api/uploads";
import type { Lead, LeadCategoryId } from "@/types";

/**
 * Uploads a requirement attachment directly to storage via a presigned URL and
 * returns the bucket key to persist — same flow the web app uses. The key (not a
 * URL) is stored on the lead's `imageUrl`; reads resolve it later.
 */
export function uploadLeadAttachment(file: File): Promise<string> {
	return uploadImageViaPresign(file, "leads");
}

/** The kind of requirement being posted (mirrors the web `RequirementType`). */
export type RequirementType = "professional" | "property" | "material";

/** Data the Post Requirement form collects before it's mapped to the API body. */
export interface RequirementInput {
	type: RequirementType;
	/** Buy/sell — property & material only (professional has no intent). */
	intent?: "buy" | "sell";
	/** Professional / material: selected category names (become the lead tags). */
	categories?: string[];
	/** Property: encoded `"group,type"` (e.g. `"residential,flat"`). */
	propertyRequirement?: string;
	/** Society name (buy residential) or commercial property name. */
	placeName?: string;
	description: string;
	address?: string;
	/** Structured address parts from the Google Places autocomplete selection. */
	locality?: string;
	city?: string;
	state?: string;
	pincode?: string;
	latitude?: string;
	longitude?: string;
	/** Raw price digits; sent as a decimal `budget` only when positive. */
	price?: string;
	/** Comma-joined attachment bucket keys (sell requirements only). */
	imageUrl?: string;
}

/**
 * Posts a requirement to `POST /app/leads` (auth). Maps the form input to the
 * body the API expects, exactly like the web app's `toLeadBody`: buy/sell folds
 * into the category (`buy_property` / `sell_material` / …); professional stays
 * plain; `requirement` carries the property `"group,type"` or the joined
 * category names; `budget` is a positive decimal string or omitted.
 */
export async function createRequirement(
	input: RequirementInput,
): Promise<void> {
	const category =
		input.type === "property"
			? `${input.intent ?? "buy"}_property`
			: input.type === "material"
				? `${input.intent ?? "buy"}_material`
				: "professional";

	const requirement =
		input.type === "property"
			? (input.propertyRequirement ?? "")
			: (input.categories ?? []).join(",");

	const body: Record<string, string> = {
		category,
		requirement,
		description: input.description.trim(),
	};
	if (input.address?.trim()) body.address = input.address.trim();
	if (input.locality?.trim()) body.locality = input.locality.trim();
	if (input.city?.trim()) body.city = input.city.trim();
	if (input.state?.trim()) body.state = input.state.trim();
	if (input.pincode?.trim()) body.pincode = input.pincode.trim();
	if (input.latitude?.trim()) body.latitude = input.latitude.trim();
	if (input.longitude?.trim()) body.longitude = input.longitude.trim();
	if (input.placeName?.trim()) body.placeName = input.placeName.trim();
	if (input.imageUrl?.trim()) body.imageUrl = input.imageUrl.trim();

	const price = Number(input.price);
	if (input.price?.trim() && Number.isFinite(price) && price > 0) {
		body.budget = price.toFixed(2);
	}

	await apiPost("/app/leads", body, { auth: true });
}

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
	/** buy/sell (property & material) — narrows the category variant. */
	intent?: string[];
	/** Property-group tokens (residential / commercial / agriculture). */
	propertyGroup?: string[];
	/** Selected `city~locality` location tokens (from the `/filters` facets). */
	places?: string[];
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
	for (const v of query.intent ?? []) params.append("intent", v);
	for (const v of query.propertyGroup ?? []) params.append("propertyGroup", v);
	for (const token of query.places ?? []) params.append("places", token);
	return params;
}

/**
 * Grouped city→locality location facets for the leads filter (public). Counts
 * are scoped to the current category/intent/search but not to the selected
 * location — mirroring the web sidebar.
 */
export async function fetchLeadFilters(
	query: LeadsQuery = {},
	signal?: AbortSignal,
): Promise<LocationFacet[]> {
	const params = new URLSearchParams();
	if (query.category) params.set("category", query.category);
	const search = query.search?.trim();
	if (search) params.set("search", search);
	for (const v of query.intent ?? []) params.append("intent", v);
	for (const v of query.propertyGroup ?? []) params.append("propertyGroup", v);
	return (
		(await apiGet<LocationFacet[]>(`/app/leads/filters?${params.toString()}`, {
			signal,
		})) ?? []
	);
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

/** One page of the signed-in user's own posted leads (`GET /app/leads/mine`). */
export function getMyLeads(
	query: LeadsQuery = {},
	signal?: AbortSignal,
): Promise<LeadsPage> {
	return fetchLeadsPage("/app/leads/mine", query, true, signal);
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
