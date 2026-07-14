import { apiGet, apiPost } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import type { ShortlistEntity } from "@/types";

/**
 * Shortlist (save/unsave) API + a small client-side cache of the saved-id sets,
 * so hearts can render their real state without a request per card and stay in
 * sync as the user toggles. Cache is keyed by `entityType:token` (mirrors the
 * web app) — a sign-out/sign-in naturally gets a fresh set.
 */

const cache: Record<string, string[]> = {};
const inflight: Record<string, Promise<string[]>> = {};

function keyFor(entityType: ShortlistEntity): string | null {
	const token = getAccessToken();
	return token ? `${entityType}:${token}` : null;
}

/** Already-fetched saved ids for this entity (empty until seeded). */
export function cachedShortlistIds(entityType: ShortlistEntity): string[] {
	const key = keyFor(entityType);
	return key ? (cache[key] ?? []) : [];
}

/**
 * The signed-in user's saved ids for an entity type. Cached + de-duped across
 * concurrent callers, so many cards mounting at once share one request. Returns
 * `[]` when logged out or on error (never throws).
 */
export async function getShortlistedIds(
	entityType: ShortlistEntity,
): Promise<string[]> {
	const key = keyFor(entityType);
	if (!key) return [];
	if (cache[key]) return cache[key];
	if (!inflight[key]) {
		inflight[key] = apiGet<(string | number)[]>(
			`/app/shortlists/my-ids?entityType=${entityType}`,
			{ auth: true },
		)
			.then((ids) => {
				const strings = ids.map(String);
				cache[key] = strings;
				return strings;
			})
			.catch(() => [])
			.finally(() => {
				delete inflight[key];
			});
	}
	return inflight[key];
}

/** Toggle-save an entity; returns the new saved state. Requires auth. */
export async function toggleSave(
	entityType: ShortlistEntity,
	entityId: string,
): Promise<boolean> {
	const { isSaved } = await apiPost<{ isSaved: boolean }>(
		"/app/shortlists/toggle",
		{ entityType, entityId },
		{ auth: true },
	);

	const key = keyFor(entityType);
	if (key && cache[key]) {
		const id = String(entityId);
		cache[key] = isSaved
			? [...new Set([...cache[key], id])]
			: cache[key].filter((saved) => saved !== id);
	}
	return isSaved;
}
