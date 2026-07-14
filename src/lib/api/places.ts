import { apiGet } from "@/lib/api/client";

/**
 * Google Places (New) client — talks to the backend proxy (`/app/places/*`), so
 * the API key stays server-side. Mirrors the web `lib/api/places.ts`. Every call
 * is toast-free and fails soft (empty / null) so the address field never crashes
 * on a lookup error.
 */

/** One autocomplete prediction for the dropdown. */
export interface PlacePrediction {
	placeId: string;
	primaryText: string;
	secondaryText: string;
	fullText: string;
}

/** Structured address resolved from a selected prediction. */
export interface AddressResult {
	address: string;
	locality: string;
	city: string;
	state: string;
	pincode: string;
	country: string;
	full: string;
	latitude: string;
	longitude: string;
}

/** Address predictions for `input` (India), grouped under `sessionToken`. */
export async function placeAutocomplete(
	input: string,
	sessionToken: string,
): Promise<PlacePrediction[]> {
	try {
		const params = new URLSearchParams({ input, sessionToken });
		return (
			(await apiGet<PlacePrediction[]>(
				`/app/places/autocomplete?${params.toString()}`,
			)) ?? []
		);
	} catch {
		return [];
	}
}

/** Resolve a prediction to a structured address; null on any failure. */
export async function placeDetails(
	placeId: string,
	sessionToken: string,
): Promise<AddressResult | null> {
	try {
		const params = new URLSearchParams({ placeId, sessionToken });
		return (
			(await apiGet<AddressResult>(
				`/app/places/details?${params.toString()}`,
			)) ?? null
		);
	} catch {
		return null;
	}
}

/** Reverse-geocode coordinates to a structured address; null on failure. */
export async function placeReverseGeocode(
	latitude: string,
	longitude: string,
): Promise<AddressResult | null> {
	try {
		const params = new URLSearchParams({ latitude, longitude });
		return (
			(await apiGet<AddressResult>(
				`/app/places/reverse-geocode?${params.toString()}`,
			)) ?? null
		);
	} catch {
		return null;
	}
}
