import { LISTING_PAGE_SIZE } from "@/config/api";
import { apiGet, apiGetEnvelope } from "@/lib/api/client";
import { decodeProfessionalId } from "@/constants/routes";
import {
	applyGeoScopeParams,
	applyGeoSearchParams,
	type GeoQuery,
	type SortSpec,
} from "@/lib/geo/geo";
import type {
	DirectoryCategoryId,
	PortfolioItem,
	ProfessionalDetail,
	ProfessionalListing,
	Showcase,
	ShowcaseKind,
} from "@/types";

/** Raw user record from `GET /app/users` — numeric fields may arrive as strings. */
interface ApiUser {
	id: string;
	name: string;
	category?: DirectoryCategoryId;
	profession: string;
	location: string;
	description: string;
	image?: string;
	rating?: string | number;
	ratingAverage?: string | number;
	categoryAverages?: {
		quality?: string | number;
		behaviour?: string | number;
		timeliness?: string | number;
		communication?: string | number;
		price?: string | number;
	};
	reviewCount?: string | number;
	experienceYears?: string | number;
	leadCount?: string | number;
	showcase?: {
		kind?: ShowcaseKind;
		count?: string | number;
		items?: PortfolioItem[];
	};
	/** Supplier-only: stocked brands + authorized-dealer brands (name arrays). */
	brands?: string[];
	authorizedBrands?: string[];
	/** Dealer-only: RERA certification. */
	isReraCertified?: boolean;
	reraNumber?: string | null;
}

const toNumber = (value: string | number | undefined): number => {
	const n = typeof value === "string" ? Number(value) : (value ?? 0);
	return Number.isFinite(n) ? (n as number) : 0;
};

const SHOWCASE_KIND_BY_CATEGORY: Record<DirectoryCategoryId, ShowcaseKind> = {
	professionals: "portfolio",
	"property-dealers": "properties",
	"material-suppliers": "products",
};

function toShowcase(user: ApiUser, category: DirectoryCategoryId): Showcase {
	const kind = SHOWCASE_KIND_BY_CATEGORY[category] ?? "portfolio";
	if (user.showcase) {
		return {
			kind: user.showcase.kind ?? kind,
			count: toNumber(user.showcase.count),
			items: user.showcase.items ?? [],
		};
	}
	return { kind, count: 0, items: [] };
}

function toProfessionalListing(
	user: ApiUser,
	fallbackCategory: DirectoryCategoryId,
): ProfessionalListing {
	const category = user.category ?? fallbackCategory;
	return {
		id: user.id,
		name: user.name,
		category,
		profession: user.profession,
		location: user.location,
		description: user.description,
		image: user.image,
		rating: toNumber(user.rating),
		ratingAverage: toNumber(user.ratingAverage),
		categoryAverages: {
			quality: toNumber(user.categoryAverages?.quality),
			behaviour: toNumber(user.categoryAverages?.behaviour),
			timeliness: toNumber(user.categoryAverages?.timeliness),
			communication: toNumber(user.categoryAverages?.communication),
			price: toNumber(user.categoryAverages?.price),
		},
		reviewCount: toNumber(user.reviewCount),
		experienceYears: toNumber(user.experienceYears),
		leadCount: toNumber(user.leadCount),
		showcase: toShowcase(user, category),
		// Supplier/dealer extras — only present for their track, undefined otherwise.
		brands: user.brands,
		authorizedBrands: user.authorizedBrands,
		isReraCertified: user.isReraCertified,
		reraNumber: user.reraNumber ?? null,
	};
}

/** Directory tab → API `userType` filter. */
const USER_TYPE_BY_CATEGORY: Record<DirectoryCategoryId, string> = {
	professionals: "professional",
	"material-suppliers": "supplier",
	"property-dealers": "dealer",
};

const DIRECTORY_SORT_MAP: Record<string, SortSpec> = {
	latest: { sortBy: "createdAt", sortOrder: "DESC" },
	topRated: { sortBy: "overallRating", sortOrder: "DESC" },
	experienced: { sortBy: "experience", sortOrder: "DESC" },
};

export interface DirectoryQuery extends GeoQuery {
	// GeoQuery contributes: sort, lat, lng, radius, nearCity.
	category?: DirectoryCategoryId;
	page?: number;
	limit?: number;
	search?: string;
	/** Single professional-category id (professionals track). */
	professionalUserType?: string;
	/** Single supplier product-category id (suppliers track). */
	productType?: string;
	/** Selected `city~locality` location tokens (from the `/filters` facets). */
	places?: string[];
	/** Only professionals with published reviews. */
	hasReviews?: boolean;
	/** Only professionals with an approved portfolio. */
	hasPortfolio?: boolean;
	/** Selected brand ids (suppliers track) — sent as repeated `brand` params. */
	brands?: string[];
}

export interface DirectoryPage {
	items: ProfessionalListing[];
	totalPages: number;
	totalItems?: number;
	/** Per-track counts from `meta.counts` (Saved Professionals tabs). */
	counts?: Record<string, number>;
}

/** One selectable locality within a city facet, with its result count + token. */
export interface LocationArea {
	id: string;
	label: string;
	count: number;
	/** `city~locality` token to send in `places`. */
	value: string;
}

/** A city's grouped locality facets for the directory filter. */
export interface LocationFacet {
	id: string;
	label: string;
	areas: LocationArea[];
}

/** One brand facet (suppliers) with its result count; `value` is the brand id. */
export interface BrandFacet {
	id: string;
	label: string;
	count: number;
	value: string;
}

/** Directory filter facets returned by `/app/users/filters`. */
export interface DirectoryFilters {
	locations: LocationFacet[];
	/** Populated for the suppliers track only; empty otherwise. */
	brands: BrandFacet[];
}

function buildDirectoryParams(query: DirectoryQuery): URLSearchParams {
	const params = new URLSearchParams();
	if (query.category) {
		params.set("userType", USER_TYPE_BY_CATEGORY[query.category]);
	}
	params.set("page", String(query.page ?? 1));
	params.set("limit", String(query.limit ?? LISTING_PAGE_SIZE));

	const search = query.search?.trim().slice(0, 100);
	if (search) params.set("search", search);

	// Sort + geo (distance ordering when a city is scoped) — shared with leads.
	applyGeoSearchParams(params, query, DIRECTORY_SORT_MAP);

	if (query.professionalUserType) {
		params.set("professionalUserType", query.professionalUserType);
	}
	if (query.productType) params.set("productType", query.productType);
	for (const token of query.places ?? []) params.append("places", token);
	if (query.hasReviews) params.set("hasReviews", "true");
	if (query.hasPortfolio) params.set("hasPortfolio", "true");
	for (const brand of query.brands ?? []) params.append("brand", brand);
	return params;
}

async function fetchUserPage(
	basePath: string,
	query: DirectoryQuery,
	auth: boolean,
	signal?: AbortSignal,
): Promise<DirectoryPage> {
	const params = buildDirectoryParams(query);
	const { data, meta } = await apiGetEnvelope<ApiUser[]>(
		`${basePath}?${params.toString()}`,
		{ auth, signal },
	);
	const items = (data ?? []).map((user) =>
		toProfessionalListing(user, query.category ?? "professionals"),
	);
	return {
		items,
		totalPages: meta?.totalPages ?? 0,
		totalItems: meta?.total ?? 0,
		counts: meta?.counts,
	};
}

/** One page of the public users API, normalized into `ProfessionalListing`s. */
export function fetchProfessionals(
	query: DirectoryQuery = {},
	signal?: AbortSignal,
): Promise<DirectoryPage> {
	return fetchUserPage("/app/users", query, false, signal);
}

/**
 * Grouped city→locality location facets for the directory filter (public). The
 * counts are scoped to the current track/type/search but NOT to the selected
 * location, so a checked place keeps its count — mirroring the web sidebar.
 */
export async function fetchDirectoryFilters(
	query: DirectoryQuery = {},
	signal?: AbortSignal,
): Promise<DirectoryFilters> {
	const params = new URLSearchParams();
	if (query.category) {
		params.set("userType", USER_TYPE_BY_CATEGORY[query.category]);
	}
	const search = query.search?.trim().slice(0, 100);
	if (search) params.set("search", search);
	if (query.professionalUserType) {
		params.set("professionalUserType", query.professionalUserType);
	}
	if (query.productType) params.set("productType", query.productType);
	// Forward the boolean toggles so the facet counts match the listing (the API
	// scopes counts by these too); the selected localities are intentionally NOT
	// sent — a facet must not filter its own options.
	if (query.hasReviews) params.set("hasReviews", "true");
	if (query.hasPortfolio) params.set("hasPortfolio", "true");
	// Scope facet counts by the selected city's radius (matches the listing).
	applyGeoScopeParams(params, query);

	const data = await apiGet<{
		locations?: LocationFacet[];
		brands?: BrandFacet[];
	}>(`/app/users/filters?${params.toString()}`, { signal });
	return { locations: data.locations ?? [], brands: data.brands ?? [] };
}

/** One page of the signed-in user's shortlisted professionals (auth). */
export function fetchShortlistedProfessionals(
	query: DirectoryQuery = {},
	signal?: AbortSignal,
): Promise<DirectoryPage> {
	return fetchUserPage("/app/shortlists/users", query, true, signal);
}

/** Full professional profile by encoded slug. Returns `null` when not found. */
export async function getProfessionalDetail(
	slug: string,
	signal?: AbortSignal,
): Promise<ProfessionalDetail | null> {
	try {
		const id = decodeProfessionalId(slug);
		return await apiGet<ProfessionalDetail>(`/app/users/${id}`, { signal });
	} catch {
		return null;
	}
}

/** Similar professionals for the detail-page rail. Fails soft to an empty list. */
export async function fetchSimilarProfessionals(
	slug: string,
	signal?: AbortSignal,
): Promise<ProfessionalListing[]> {
	try {
		const id = decodeProfessionalId(slug);
		const data = await apiGet<ApiUser[]>(`/app/users/${id}/similar`, {
			signal,
		});
		return (data ?? []).map((user) =>
			toProfessionalListing(user, user.category ?? "professionals"),
		);
	} catch {
		return [];
	}
}
