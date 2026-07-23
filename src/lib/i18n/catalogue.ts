import { API_BASE_URL } from "@/config/api";

/**
 * The translation catalogue for a locale, fetched from the same backend
 * endpoint the web uses (GET /app/translations/:code) and shaped identically, so
 * the mobile app consumes the **same keys** as the web via use-intl.
 *
 * The API returns a flat `{ "category.slug": text }` map (all categories:
 * ui_text + success/error messages). We drop the leading category bucket and
 * un-flatten the slug into the nested namespaces use-intl expects — the exact
 * transform the web's `services/translations.service.ts` performs.
 */

/** use-intl message tree: nested namespaces of strings. */
export type Messages = { [key: string]: string | Messages };

/** Envelope shape the NestJS BuildResponse interceptor wraps responses in. */
type TranslationsResponse = { data?: Record<string, string> };

/**
 * Expand the API's flat `{ "category.slug": text }` map into the nested tree
 * use-intl expects. The leading category bucket (e.g. `ui_text`) is an
 * admin-side grouping, not part of the client key, so it is dropped — the slug
 * is the key path. Slugs are unique across categories (enforced in the seed).
 */
function unflatten(flat: Record<string, string>): Messages {
	const root: Messages = {};
	for (const [fullKey, value] of Object.entries(flat)) {
		const dot = fullKey.indexOf(".");
		const key = dot === -1 ? fullKey : fullKey.slice(dot + 1);
		const segments = key.split(".");
		let node = root;
		for (let i = 0; i < segments.length - 1; i++) {
			const segment = segments[i];
			if (typeof node[segment] !== "object" || node[segment] === null) {
				node[segment] = {};
			}
			node = node[segment] as Messages;
		}
		node[segments[segments.length - 1]] = value;
	}
	return root;
}

/** Per-locale catalogue cache — a locale's messages are fetched at most once. */
const cache = new Map<string, Messages>();

/**
 * Resolve the use-intl message tree for a locale from the API. On any failure an
 * empty catalogue is returned (degraded — components fall back to the key)
 * rather than crashing, matching the web's fail-soft behaviour.
 */
export async function getMessagesForLocale(locale: string): Promise<Messages> {
	const hit = cache.get(locale);
	if (hit) return hit;
	try {
		const res = await fetch(`${API_BASE_URL}/app/translations/${locale}`);
		if (!res.ok) {
			throw new Error(`Translations request failed: ${res.status}`);
		}
		const body = (await res.json()) as TranslationsResponse;
		const flat = body.data;
		if (!flat || Object.keys(flat).length === 0) {
			throw new Error("Translations response contained no data");
		}
		const messages = unflatten(flat);
		cache.set(locale, messages);
		return messages;
	} catch (error) {
		console.error(
			`[i18n] Could not load translations for "${locale}" from the API:`,
			error,
		);
		return {};
	}
}
