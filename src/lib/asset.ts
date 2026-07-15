/**
 * Resolves a stored media value to a loadable URL. The API resolves storage
 * keys to absolute URLs server-side (presigned GET for profile/portfolio,
 * public URL for leads), so values arriving here are already loadable and pass
 * through unchanged: remote (`http(s):`), object-URL previews (`blob:`), inline
 * data URIs (`data:`) and app-relative bundled assets (`/…`). Returns `null` for
 * an empty value or a bare, unresolved storage key (nothing to load).
 */
export function assetUrl(path?: string | null): string | null {
	if (!path) return null;
	if (/^(https?:|blob:|data:|\/)/i.test(path)) return path;
	// Not a loadable URL — a bare storage key the API didn't resolve.
	return null;
}
