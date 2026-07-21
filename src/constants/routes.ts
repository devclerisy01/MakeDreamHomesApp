import { WEB_APP_URL } from "@/config/api";

/** Route paths for the mobile app (react-router v5). */
export const ROUTES = {
	home: "/home",
	leads: "/leads",
	requirement: "/requirement",
	professionals: "/professionals",
	profile: "/profile",
	messages: "/messages",
} as const;

/** Path to a single conversation thread. */
export function conversationHref(id: string): string {
	return `${ROUTES.messages}/${id}`;
}

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

/** Directory-category → web `userType` path segment (matches the web app). */
const WEB_USER_TYPE_BY_CATEGORY: Record<string, string> = {
	professionals: "professional",
	"material-suppliers": "supplier",
	"property-dealers": "dealer",
};

/** URL-safe slug for a display string (name/trade) — mirrors the web `slugify`. */
function slugify(value?: string | null): string {
	return (value ?? "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Public (web) profile URL for sharing. Rebuilds the web app's
 * `/detail/<userType>/[<profession>/]<name>/<base64Id>` slug so the shared link
 * opens the real profile page in a browser and stays cross-compatible with web.
 */
export function publicProfileUrl(opts: {
	id: string;
	userType?: string | null;
	category?: string;
	profession?: string | null;
	name?: string | null;
}): string {
	const userType =
		opts.userType ||
		WEB_USER_TYPE_BY_CATEGORY[opts.category ?? ""] ||
		"professional";
	const encId = encodeProfessionalId(opts.id);
	const nameSlug = slugify(opts.name) || "profile";
	const path =
		userType === "professional"
			? `/detail/professional/${slugify(opts.profession) || "professional"}/${nameSlug}/${encId}`
			: `/detail/${userType}/${nameSlug}/${encId}`;
	return `${WEB_APP_URL}/en${path}`;
}
