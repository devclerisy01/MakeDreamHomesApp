import { useSyncExternalStore } from "react";

import { defaultLocale } from "@/i18n/config";

/**
 * Persisted "selected locale" store. Mirrors the location store (module
 * snapshot + listeners + `useSyncExternalStore` + `localStorage`), replacing the
 * web's NEXT_LOCALE cookie. Holds just the locale code; the `IntlProvider`
 * subscribes to it and (re)loads the matching catalogue whenever it changes.
 */

const LOCALE_KEY = "mdh.locale";

function read(): string | null {
	try {
		return localStorage.getItem(LOCALE_KEY);
	} catch {
		return null;
	}
}

function write(value: string): void {
	try {
		localStorage.setItem(LOCALE_KEY, value);
	} catch {
		/* storage unavailable — snapshot still updates for this session */
	}
}

let snapshot: string = read() ?? defaultLocale;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot(): string {
	return snapshot;
}

/** Change the active locale (persisted); re-renders subscribers. No-op if same. */
export function setLocale(code: string): void {
	if (code === snapshot) return;
	snapshot = code;
	write(code);
	for (const listener of listeners) listener();
}

/** Reactive selected-locale — re-renders the IntlProvider + header on change. */
export function useSelectedLocale(): string {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
