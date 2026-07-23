/**
 * Locale primitives for the mobile app. Mirrors the web's `i18n/config.ts`: the
 * authoritative, runtime list of supported languages is the backend `languages`
 * table (GET /app/languages, via `lib/i18n/languages.ts`). Everything here is a
 * static constant — the canonical default locale, a degraded fallback set used
 * only when the API is unreachable, and native-name overrides for the switcher.
 */

/** Canonical default locale. Mirrors the backend's seeded default language. */
export const defaultLocale = "en";

/**
 * Global default time zone (IANA name). use-intl formats dates/times in this
 * zone so the app is deterministic regardless of the device zone. The app is
 * India-first (en/hi/pa, ₹), so IST is the sensible default.
 */
export const defaultTimeZone = "Asia/Kolkata";

/** A locale code (BCP-47), e.g. 'en', 'hi', 'pa-IN'. Dynamic, so just a string. */
export type Locale = string;

/** One language as the app consumes it (shape mirrors GET /app/languages). */
export type Language = {
	code: Locale;
	/** English display name from the backend, e.g. "Hindi". */
	name: string;
	isDefault: boolean;
};

/**
 * Degraded fallback, used only when the languages API is unreachable, so the
 * switcher keeps working with the originally-shipped locales instead of
 * breaking. Mirrors the backend's seeded languages.
 */
export const FALLBACK_LANGUAGES: Language[] = [
	{ code: "en", name: "English", isDefault: true },
	{ code: "hi", name: "Hindi", isDefault: false },
	{ code: "pa", name: "Punjabi", isDefault: false },
];

/**
 * Native-name (endonym) overrides for the language switcher, keyed by code. The
 * backend stores only English names; this lets the menu render each language in
 * its own script. Any code missing here falls back to the backend name, so a
 * newly added language still shows a sensible label until an override is added.
 */
const NATIVE_NAMES: Record<string, string> = {
	en: "English",
	hi: "हिंदी",
	pa: "ਪੰਜਾਬੀ",
};

/** Switcher label: the native override if known, otherwise the backend name. */
export function localeLabel(code: string, name: string): string {
	return NATIVE_NAMES[code] ?? name;
}
