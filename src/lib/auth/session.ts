import { useSyncExternalStore } from "react";

import type { AuthUser } from "@/lib/api/auth";

/**
 * Session store for the mobile app. Tokens + a cached user live in
 * `localStorage` (available in the Capacitor WebView and on web), under the
 * same `mdh.*` keys the web app uses so the backend session shape is reused.
 *
 * An in-memory snapshot mirrors storage so React can subscribe to auth changes
 * (via {@link useAuth}) with stable references — components re-render the moment
 * a session is stored or cleared.
 */
export interface Session {
	accessToken: string;
	refreshToken: string;
	user?: AuthUser;
}

const ACCESS_KEY = "mdh.accessToken";
const REFRESH_KEY = "mdh.refreshToken";
const USER_KEY = "mdh.user";

function read(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* storage unavailable — snapshot still updates for this session */
	}
}

function remove(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch {
		/* nothing to clear */
	}
}

function parseUser(raw: string | null): AuthUser | null {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as AuthUser;
	} catch {
		return null;
	}
}

interface Snapshot {
	token: string | null;
	user: AuthUser | null;
}

// Single source of truth for reactive reads — kept in sync with localStorage.
let snapshot: Snapshot = {
	token: read(ACCESS_KEY),
	user: parseUser(read(USER_KEY)),
};

const listeners = new Set<() => void>();

function emit(next: Snapshot): void {
	snapshot = next;
	for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot(): Snapshot {
	return snapshot;
}

export function getAccessToken(): string | null {
	return snapshot.token;
}

export function getRefreshToken(): string | null {
	return read(REFRESH_KEY);
}

export function isLoggedIn(): boolean {
	return !!snapshot.token;
}

/** Persists the tokens (+ user, when present) returned by login/register/refresh. */
export function storeSession(session: Session): void {
	write(ACCESS_KEY, session.accessToken);
	write(REFRESH_KEY, session.refreshToken);
	let user = snapshot.user;
	if (session.user !== undefined) {
		user = session.user;
		write(USER_KEY, JSON.stringify(session.user));
	}
	emit({ token: session.accessToken, user });
}

/** Clears the whole session (sign-out / invalid token). */
export function clearSession(): void {
	remove(ACCESS_KEY);
	remove(REFRESH_KEY);
	remove(USER_KEY);
	emit({ token: null, user: null });
}

/** Reactive auth state — re-renders on sign-in / sign-out / profile update. */
export function useAuth(): {
	token: string | null;
	user: AuthUser | null;
	isAuthed: boolean;
} {
	const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	return { token: snap.token, user: snap.user, isAuthed: !!snap.token };
}
