import { LISTING_PAGE_SIZE } from "@/config/api";
import { apiGet, apiGetEnvelope, apiPost } from "@/lib/api/client";
import type { LocationFacet } from "@/lib/api/professionals";
import { uploadImageViaPresign } from "@/lib/api/uploads";
import {
	applyGeoScopeParams,
	applyGeoSearchParams,
	type GeoQuery,
	type SortSpec,
} from "@/lib/geo/geo";
import type { Lead, LeadCategoryId } from "@/types";

/** Leads sort options → API sortBy/sortOrder (distance handled by the geo helper). */
const LEAD_SORT_MAP: Record<string, SortSpec> = {
	latest: { sortBy: "createdAt", sortOrder: "DESC" },
};

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
	/** Professional track: hire someone vs. offer yourself for work. */
	proIntent?: "hire" | "available";
	/** Professional / material: selected category names (become the lead tags). */
	categories?: string[];
	/** Property: category group slug (residential / commercial / agriculture). */
	propertyGroup?: string;
	/** Property: concrete type slug (e.g. `flat`); empty for commercial/agriculture. */
	propertyType?: string;
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
	// Buy/sell folds into the category for property & material; the professional
	// track folds hire-vs-available the same way (`hire_professional` /
	// `available_professional`) — the API only recognises those two for the
	// professional family, so sending a bare "professional" hides the lead.
	const category =
		input.type === "property"
			? `${input.intent ?? "buy"}_property`
			: input.type === "material"
				? `${input.intent ?? "buy"}_material`
				: input.proIntent === "available"
					? "available_professional"
					: "hire_professional";

	const body: Record<string, string> = {
		category,
		description: input.description.trim(),
	};

	// Property keeps the group in `requirement` and the concrete type in the
	// dedicated `propertyType` field; other tracks send category names/ids via
	// `requirement`.
	if (input.type === "property") {
		if (input.propertyGroup?.trim())
			body.requirement = input.propertyGroup.trim();
		if (input.propertyType?.trim())
			body.propertyType = input.propertyType.trim();
	} else {
		body.requirement = (input.categories ?? []).join(",");
	}
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

export interface LeadsQuery extends GeoQuery {
	// GeoQuery contributes: sort, lat, lng, radius, nearCity.
	category?: string;
	page?: number;
	limit?: number;
	search?: string;
	/** Decoded professional id to scope leads to (from `?userId=`). */
	userId?: string;
	/** buy/sell OR hire/available — narrows the category variant. */
	intent?: string[];
	/** Profession/product sub-category (single, substring-matched by the API). */
	subcategory?: string;
	/** Property-group tokens (residential / commercial / agriculture). */
	propertyGroup?: string[];
	/** Property concrete-type tokens (flat / plot / kothi / …). */
	propertyType?: string[];
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
	if (query.subcategory?.trim())
		params.set("subcategory", query.subcategory.trim());

	// Sort + geo (distance ordering when a city is scoped) — shared with directory.
	applyGeoSearchParams(params, query, LEAD_SORT_MAP);

	if (query.userId?.trim()) params.set("userId", query.userId.trim());
	for (const v of query.intent ?? []) params.append("intent", v);
	for (const v of query.propertyGroup ?? []) params.append("propertyGroup", v);
	for (const v of query.propertyType ?? []) params.append("propertyType", v);
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
	if (query.subcategory?.trim())
		params.set("subcategory", query.subcategory.trim());
	for (const v of query.intent ?? []) params.append("intent", v);
	for (const v of query.propertyGroup ?? []) params.append("propertyGroup", v);
	for (const v of query.propertyType ?? []) params.append("propertyType", v);
	// Scope facet counts by the selected city's radius (matches the listing).
	applyGeoScopeParams(params, query);
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

/**
 * Display label for the intent chip on a lead card (matches the web's
 * `INTENT_CHIP`): buy/sell for property & material, hire/available for the
 * professional track. Returns null when there's no intent to show.
 */
export function leadIntentChip(category: string): string | null {
	const c = category.toLowerCase();
	if (c.startsWith("buy")) return "Buy";
	if (c.startsWith("sell")) return "Sell";
	if (c.startsWith("hire")) return "Hiring";
	if (c.startsWith("available")) return "Available";
	return null;
}

/** Base track derived from the raw category. */
export function leadBaseCategory(category: string): LeadCategoryId {
	const c = category.toLowerCase();
	if (c.includes("property")) return "property";
	if (c.includes("material")) return "material";
	return "professional";
}
