import { API_BASE_URL } from "@/config/api";
import { FALLBACK_LANGUAGES, type Language, localeLabel } from "@/i18n/config";

/**
 * Active languages for the switcher, sourced from the backend `languages` table
 * (GET /app/languages). Mirrors the web's `services/languages.service.ts`, but
 * fetched with a plain `fetch` (not the app API client) so a failed lookup fails
 * soft and silently — the switcher must never toast or crash. Memoized in-module
 * for the app's lifetime (the language set changes rarely).
 */

/** Envelope shape the NestJS BuildResponse interceptor wraps responses in. */
type LanguagesResponse = { data?: Language[] };

/** One option for the language switcher (code + ready-to-render label). */
export type LanguageOption = { code: string; label: string };

let cached: Language[] | null = null;
let inflight: Promise<Language[]> | null = null;

async function fetchLanguages(): Promise<Language[]> {
	const res = await fetch(`${API_BASE_URL}/app/languages`);
	if (!res.ok) throw new Error(`Languages request failed: ${res.status}`);
	const body = (await res.json()) as LanguagesResponse;
	const list = body.data;
	if (!list || list.length === 0) {
		throw new Error("Languages response contained no data");
	}
	return list;
}

/**
 * The active languages. Memoized after the first success; on a failed refresh it
 * serves the last good value if there is one, otherwise the shipped
 * FALLBACK_LANGUAGES, so the switcher never breaks on a transient API outage.
 */
async function getLanguages(): Promise<Language[]> {
	if (cached) return cached;
	if (inflight) return inflight;

	inflight = (async () => {
		try {
			cached = await fetchLanguages();
			return cached;
		} catch (error) {
			console.error(
				"[i18n] Could not load languages from the API; using fallback:",
				error,
			);
			return cached ?? FALLBACK_LANGUAGES;
		} finally {
			inflight = null;
		}
	})();
	return inflight;
}

/** Switcher options with display labels (native override, else backend name). */
export async function getLanguageOptions(): Promise<LanguageOption[]> {
	return (await getLanguages()).map((l) => ({
		code: l.code,
		label: localeLabel(l.code, l.name),
	}));
}
