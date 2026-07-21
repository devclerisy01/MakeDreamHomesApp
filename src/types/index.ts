/** Shared domain types (ported from the web app's `types/index.ts`). */

/* ------------------------------------------------------------------ */
/* Professionals / Suppliers / Dealers directory                       */
/* ------------------------------------------------------------------ */

export type DirectoryCategoryId =
	"property-dealers" | "material-suppliers" | "professionals";

/** Per-category published-review averages (0 when the professional has none). */
export interface CategoryAverages {
	quality: number;
	behaviour: number;
	timeliness: number;
	communication: number;
	price: number;
}

/** A single project shown in a professional's portfolio strip. */
export interface PortfolioItem {
	id: string;
	/** Null for professional portfolios (only property/product entries have a title). */
	title: string | null;
	/** Directory/showcase items carry `city`; the detail endpoint sends `location`. */
	city?: string;
	location?: string;
	address?: string;
	image?: string;
}

/** Which kind of items a card's showcase strip holds, by track. */
export type ShowcaseKind = "portfolio" | "properties" | "products";

/** Track-agnostic "what this user has to show" block: count + thumbnails. */
export interface Showcase {
	kind: ShowcaseKind;
	count: number;
	items: PortfolioItem[];
}

export interface ProfessionalListing {
	id: string;
	name: string;
	category: DirectoryCategoryId;
	/** Display label for the trade, e.g. "Architects". */
	profession: string;
	location: string;
	description: string;
	/** Logo/avatar; relative keys resolve via `assetUrl`, absolute pass through. */
	image?: string;
	rating: number;
	/** Composite headline rating (mean of the non-zero sub-averages). */
	ratingAverage: number;
	categoryAverages?: CategoryAverages;
	reviewCount: number;
	experienceYears: number;
	leadCount?: number;
	showcase?: Showcase;
}

/** Aggregate per-category rating averages backing the "Rating & Reviews" breakdown. */
export interface ReviewsBreakdown {
	average: number;
	overall: number;
	quality: number;
	behaviour: number;
	timeliness: number;
	communication: number;
	price: number;
}

export interface ProfessionalReview {
	id: string;
	author: string;
	rating: number;
	comment: string;
	createdAt?: string;
	/** Per-review sub-category scores (0 when unset). Keyed by review category. */
	quality?: number;
	behaviour?: number;
	timeliness?: number;
	communication?: number;
	price?: number;
}

export interface ProfessionalDetail extends ProfessionalListing {
	about: string[];
	portfolio: PortfolioItem[];
	reviews: ProfessionalReview[];
	reviewsRating: number;
	reviewsCount: number;
	reviewsBreakdown?: ReviewsBreakdown;
}

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

export type LeadCategoryId = "property" | "material" | "professional";

export interface Lead {
	id: string;
	/** Raw category, e.g. `professional`, `buy_property`, `sell_material`. */
	category: string;
	location: string;
	/** All preferred localities for the lead; falls back to `location` when empty. */
	localities?: string[];
	description: string;
	postedBy: string;
	/** Poster's user id (for "Send Message"); null for leads not tied to a user. */
	userId?: string | null;
	createdAt: string;
	tags: string[];
	summary?: string;
	budget?: string | number | null;
	status?: string;
	/** Uploaded requirement image keys, resolved via `assetUrl`. */
	images?: string[];
}

/** Saved/shortlist entity kinds. */
export type ShortlistEntity = "users" | "leads";
