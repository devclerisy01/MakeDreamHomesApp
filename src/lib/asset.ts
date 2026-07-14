import { STORAGE_PUBLIC_URL } from "@/config/api";

/**
 * Resolves a stored media path to an absolute URL. Absolute URLs
 * (`http(s)://…`) pass through unchanged; relative keys are prefixed with the
 * public storage origin. Returns `null` for an empty/absent value.
 */
export function assetUrl(path?: string | null): string | null {
	if (!path) return null;
	// Already-loadable URLs pass through: remote (http/https), local object-URL
	// previews (blob:) and inline data URIs (data:).
	if (/^(https?:|blob:|data:)/i.test(path)) return path;
	// App-relative paths (bundled/public assets) as-is.
	if (path.startsWith("/")) return path;
	return `${STORAGE_PUBLIC_URL}${path}`;
}
