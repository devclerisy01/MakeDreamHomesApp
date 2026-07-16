import type { CityOption } from "@/lib/api/locations";

/**
 * Shared geo helpers, ported verbatim from the web app's `lib/geo.ts` (minus the
 * server cookie layer — the mobile app persists the selection in
 * {@link ../geo/location-store}). Both the directory and leads queries serialize
 * their sort + geo through here so they can never drift apart or from the web.
 */

export const CITY_RADIUS_KM = 50;
export const DEFAULT_CITY = "chandigarh";

export interface SortSpec {
	sortBy: string;
	sortOrder: "ASC" | "DESC";
}

export interface GeoQuery {
	sort?: string;
	lat?: number;
	lng?: number;
	radius?: number;
	nearCity?: string;
}

/** Great-circle distance in km between two coordinate pairs (haversine). */
export function distanceKm(
	aLat: number,
	aLng: number,
	bLat: number,
	bLng: number,
): number {
	const R = 6371;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(bLat - aLat);
	const dLng = toRad(bLng - aLng);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

/** The verified city nearest to the given coordinates (skips rows without coords). */
export function nearestCity(
	cities: CityOption[],
	lat: number,
	lng: number,
): CityOption | null {
	let best: CityOption | null = null;
	let bestDistance = Infinity;
	for (const city of cities) {
		const clat = Number(city.latitude);
		const clng = Number(city.longitude);
		if (!Number.isFinite(clat) || !Number.isFinite(clng)) continue;
		const d = distanceKm(lat, lng, clat, clng);
		if (d < bestDistance) {
			bestDistance = d;
			best = city;
		}
	}
	return best;
}

/**
 * Write the shared sort + geo params (`sortBy`/`sortOrder`, `lat`, `lng`,
 * `radius`, `nearCity`) onto a listing request. A selected city (coords +
 * radius) orders by distance by default; an explicit sort still wins;
 * `nearest` is the explicit form of distance ordering.
 */
export function applyGeoSearchParams(
	params: URLSearchParams,
	query: GeoQuery,
	sortMap: Record<string, SortSpec>,
): boolean {
	const hasCoords = query.lat != null && query.lng != null;
	const radiusScoped = hasCoords && query.radius != null;
	const orderByDistance =
		hasCoords &&
		(query.sort === "nearest" || (radiusScoped && query.sort == null));

	if (orderByDistance) {
		params.set("sortBy", "distance");
	} else {
		const mapped =
			(query.sort ? sortMap[query.sort] : undefined) ?? sortMap.latest;
		params.set("sortBy", mapped.sortBy);
		params.set("sortOrder", mapped.sortOrder);
	}

	if (orderByDistance && !radiusScoped) {
		params.set("lat", String(query.lat));
		params.set("lng", String(query.lng));
	}
	applyGeoScopeParams(params, query);
	return orderByDistance || radiusScoped;
}

/**
 * Write just the geo *scope* (`lat`/`lng`/`radius`/`nearCity`) — no ordering.
 * Used by the facet (`/filters`) endpoints so their counts cover the same radius
 * as the listing. No-op unless coordinates + radius are present.
 */
export function applyGeoScopeParams(
	params: URLSearchParams,
	query: GeoQuery,
): boolean {
	if (query.lat == null || query.lng == null || query.radius == null) {
		return false;
	}
	params.set("lat", String(query.lat));
	params.set("lng", String(query.lng));
	params.set("radius", String(query.radius));
	if (query.nearCity?.trim()) params.set("nearCity", query.nearCity.trim());
	return true;
}
