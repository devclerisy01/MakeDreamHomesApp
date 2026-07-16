import { useSyncExternalStore } from "react";

import { type CityOption, getVerifiedCities } from "@/lib/api/locations";
import {
	CITY_RADIUS_KM,
	DEFAULT_CITY,
	type GeoQuery,
	nearestCity,
} from "@/lib/geo/geo";
import { getCurrentCoordsIfGranted } from "@/lib/native/geolocation";

/**
 * Persisted "selected location" store for the header city filter. Mirrors the
 * session store (module snapshot + listeners + `useSyncExternalStore` +
 * `localStorage`), replacing the web's cookie layer. The stored shape is exactly
 * what the API wants (`nearCity` + coords + radius) plus a display state.
 */
export interface SelectedLocation {
	/** Display label + the API `nearCity` param. */
	city: string;
	state: string | null;
	lat: number;
	lng: number;
	radius: number;
}

const LOCATION_KEY = "mdh.location";

function read(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* storage unavailable — snapshot still updates for this session */
	}
}

function parseLocation(raw: string | null): SelectedLocation | null {
	if (!raw) return null;
	try {
		const v = JSON.parse(raw) as Partial<SelectedLocation>;
		if (
			typeof v.city === "string" &&
			typeof v.lat === "number" &&
			Number.isFinite(v.lat) &&
			typeof v.lng === "number" &&
			Number.isFinite(v.lng)
		) {
			return {
				city: v.city,
				state: typeof v.state === "string" ? v.state : null,
				lat: v.lat,
				lng: v.lng,
				radius:
					typeof v.radius === "number" && v.radius > 0
						? v.radius
						: CITY_RADIUS_KM,
			};
		}
	} catch {
		/* fall through */
	}
	return null;
}

let snapshot: SelectedLocation | null = parseLocation(read(LOCATION_KEY));
const listeners = new Set<() => void>();

function emit(next: SelectedLocation | null): void {
	snapshot = next;
	for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot(): SelectedLocation | null {
	return snapshot;
}

export function getLocation(): SelectedLocation | null {
	return snapshot;
}

export function setLocation(loc: SelectedLocation): void {
	write(LOCATION_KEY, JSON.stringify(loc));
	emit(loc);
}

/** Reactive selected-location — re-renders headers + fetchers on change. */
export function useSelectedLocation(): SelectedLocation | null {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Maps the selection to the API geo params (empty when nothing is selected). */
export function locationToGeo(loc: SelectedLocation | null): Partial<GeoQuery> {
	if (!loc) return {};
	return { lat: loc.lat, lng: loc.lng, radius: loc.radius, nearCity: loc.city };
}

// Verified cities — fetched once, shared across every header instance.
let citiesPromise: Promise<CityOption[]> | null = null;

/** Verified cities, cached module-wide (single flight). */
export function getVerifiedCitiesCached(): Promise<CityOption[]> {
	if (!citiesPromise) citiesPromise = getVerifiedCities().catch(() => []);
	return citiesPromise;
}

/** Build a `SelectedLocation` from a verified city (coords are strings). */
export function locationFromCity(city: CityOption): SelectedLocation | null {
	const lat = Number(city.latitude);
	const lng = Number(city.longitude);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	return {
		city: city.city,
		state: city.state,
		lat,
		lng,
		radius: CITY_RADIUS_KM,
	};
}

/**
 * One-time bootstrap: if nothing is stored yet, pick the nearest verified city
 * from the device location — but ONLY if location permission is already granted
 * (never prompts at launch); otherwise fall back to DEFAULT_CITY. The user can
 * grant location later via the header's "use my current location". Idempotent.
 */
export async function ensureLocationInitialized(): Promise<void> {
	if (getLocation()) return;
	const cities = await getVerifiedCitiesCached();
	if (!cities.length) return;

	const fallback = () => {
		const def =
			cities.find((c) => c.city.toLowerCase() === DEFAULT_CITY) ?? cities[0];
		const loc = def ? locationFromCity(def) : null;
		if (loc && !getLocation()) setLocation(loc);
	};

	// Silent read — won't pop a permission dialog on first launch.
	const result = await getCurrentCoordsIfGranted();
	if (result.ok) {
		const near = nearestCity(cities, result.latitude, result.longitude);
		const loc = near ? locationFromCity(near) : null;
		if (loc && !getLocation()) setLocation(loc);
		else fallback();
	} else {
		fallback();
	}
}
