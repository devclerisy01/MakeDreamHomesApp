/** Route paths for the mobile app (react-router v5). */
export const ROUTES = {
	home: "/home",
	leads: "/leads",
	requirement: "/requirement",
	professionals: "/professionals",
	profile: "/profile",
} as const;

/**
 * URL-safe base64 for the detail-page slug — matches the web app so the same
 * encoded ids work across both. Swaps `+`/`/` for `-`/`_` and drops padding.
 */
export function encodeProfessionalId(id: string): string {
	return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Inverse of {@link encodeProfessionalId}: restore the alphabet and padding. */
export function decodeProfessionalId(slug: string): string {
	const b64 = slug.replace(/-/g, "+").replace(/_/g, "/");
	const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
	return atob(padded);
}

/** Path to a single professional's detail page. */
export function professionalHref(id: string): string {
	return `${ROUTES.professionals}/${encodeProfessionalId(id)}`;
}
