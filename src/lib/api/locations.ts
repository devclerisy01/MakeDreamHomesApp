import { apiGet, apiPost } from "@/lib/api/client";
import type { PlacePrediction } from "@/lib/api/places";

/**
 * Verified-city + city-search API (our `locations` table), mirroring the web's
 * `services/locations.service.ts` + `lib/api/places.ts` city half. Distinct from
 * `places.ts` (the Google Places proxy). Every call fails soft so the header
 * location picker never crashes on a lookup error.
 */

/** A verified city with coordinates (rows are strings, per the API). */
export interface CityOption {
	id: string;
	city: string;
	state: string | null;
	latitude: string | null;
	longitude: string | null;
}

/** `GET /app/locations/search` response — table matches first, Places fallback. */
export interface CitySearchResult {
	/** Cities from our table (immediately selectable). */
	cities: CityOption[];
	/** Google Places predictions — only present when `cities` is empty. */
	suggestions: PlacePrediction[];
}

/** Body for `POST /app/locations/searched` (record a Places-picked city). */
export interface SearchedCity {
	city: string;
	state?: string;
	pincode?: string;
	country?: string;
	latitude?: string;
	longitude?: string;
}

/** Admin-verified cities for the picker's nearby list + auto-detect. Fail-soft. */
export async function getVerifiedCities(
	signal?: AbortSignal,
): Promise<CityOption[]> {
	try {
		return (
			(await apiGet<CityOption[]>("/app/locations/cities", { signal })) ?? []
		);
	} catch {
		return [];
	}
}

/** Type-ahead city search (our table first, Places fallback). Fail-soft. */
export async function citySearch(
	q: string,
	sessionToken: string,
	signal?: AbortSignal,
): Promise<CitySearchResult> {
	try {
		const params = new URLSearchParams({ q, sessionToken });
		const data = await apiGet<Partial<CitySearchResult>>(
			`/app/locations/search?${params.toString()}`,
			{ signal },
		);
		return { cities: data.cities ?? [], suggestions: data.suggestions ?? [] };
	} catch {
		return { cities: [], suggestions: [] };
	}
}

/** Record a Places-picked city (unapproved, admin-reviewable). Fire-and-forget. */
export async function persistSearchedCity(city: SearchedCity): Promise<void> {
	try {
		await apiPost("/app/locations/searched", city);
	} catch {
		/* non-blocking — the listing already applies via the store */
	}
}
