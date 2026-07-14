import { STORAGE_PUBLIC_URL } from "@/config/api";

/**
 * Resolves a stored media path to an absolute URL. Absolute URLs
 * (`http(s)://…`) pass through unchanged; relative keys are prefixed with the
 * public storage origin. Returns `null` for an empty/absent value.
 */
export function assetUrl(path?: string | null): string | null {
	if (!path) return null;
	if (/^https?:\/\//i.test(path)) return path;
	return `${STORAGE_PUBLIC_URL}${path}`;
}
