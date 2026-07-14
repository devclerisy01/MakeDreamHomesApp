import { LISTING_PAGE_SIZE } from "@/config/api";
import { apiGet, apiGetEnvelope } from "@/lib/api/client";
import { decodeProfessionalId } from "@/constants/routes";
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
		qualityOfWork?: string | number;
		behaviourCommunication?: string | number;
		timeliness?: string | number;
		transparencyHonesty?: string | number;
	};
	reviewCount?: string | number;
	experienceYears?: string | number;
	leadCount?: string | number;
	showcase?: {
		kind?: ShowcaseKind;
		count?: string | number;
		items?: PortfolioItem[];
	};
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
			qualityOfWork: toNumber(user.categoryAverages?.qualityOfWork),
			behaviourCommunication: toNumber(
				user.categoryAverages?.behaviourCommunication,
			),
			timeliness: toNumber(user.categoryAverages?.timeliness),
			transparencyHonesty: toNumber(user.categoryAverages?.transparencyHonesty),
		},
		reviewCount: toNumber(user.reviewCount),
		experienceYears: toNumber(user.experienceYears),
		leadCount: toNumber(user.leadCount),
		showcase: toShowcase(user, category),
	};
}

/** Directory tab → API `userType` filter. */
const USER_TYPE_BY_CATEGORY: Record<DirectoryCategoryId, string> = {
	professionals: "professional",
	"material-suppliers": "supplier",
	"property-dealers": "dealer",
};

const DIRECTORY_SORT_MAP: Record<
	string,
	{ sortBy: string; sortOrder: "ASC" | "DESC" }
> = {
	latest: { sortBy: "createdAt", sortOrder: "DESC" },
	topRated: { sortBy: "overallRating", sortOrder: "DESC" },
	experienced: { sortBy: "experience", sortOrder: "DESC" },
};

export interface DirectoryQuery {
	category?: DirectoryCategoryId;
	page?: number;
	limit?: number;
	search?: string;
	sort?: string;
	lat?: number;
	lng?: number;
	radius?: number;
}

export interface DirectoryPage {
	items: ProfessionalListing[];
	totalPages: number;
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

	if (query.sort === "nearest" && query.lat != null && query.lng != null) {
		params.set("sortBy", "distance");
		params.set("lat", String(query.lat));
		params.set("lng", String(query.lng));
	} else {
		const mapped =
			(query.sort ? DIRECTORY_SORT_MAP[query.sort] : undefined) ??
			DIRECTORY_SORT_MAP.latest;
		params.set("sortBy", mapped.sortBy);
		params.set("sortOrder", mapped.sortOrder);
	}

	if (query.radius != null && query.lat != null && query.lng != null) {
		params.set("lat", String(query.lat));
		params.set("lng", String(query.lng));
		params.set("radius", String(query.radius));
	}
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
	return { items, totalPages: meta?.totalPages ?? 0 };
}

/** One page of the public users API, normalized into `ProfessionalListing`s. */
export function fetchProfessionals(
	query: DirectoryQuery = {},
	signal?: AbortSignal,
): Promise<DirectoryPage> {
	return fetchUserPage("/app/users", query, false, signal);
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
