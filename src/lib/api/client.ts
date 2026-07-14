import { API_BASE_URL } from "@/config/api";
import { ApiError, isApiError } from "@/lib/api/errors";
import {
	clearSession,
	getAccessToken,
	getRefreshToken,
	storeSession,
} from "@/lib/auth/session";

/**
 * Browser/WebView API client. Sends JSON to the NestJS API and unwraps the
 * uniform `{ success, message, data }` envelope. Authed requests attach a
 * Bearer token and transparently refresh-and-retry once on a 401.
 */

/** Pagination/aggregate metadata carried alongside a list response's `data`. */
export interface PageMeta {
	total?: number;
	totalPages?: number;
	counts?: Record<string, number>;
}

interface ApiEnvelope<T> {
	success: boolean;
	message?: string;
	data: T;
	errors?: unknown;
	meta?: PageMeta;
}

interface RequestOptions {
	method?: string;
	body?: unknown;
	/** Attach a Bearer token and refresh-and-retry on a 401. */
	auth?: boolean;
	signal?: AbortSignal;
}

/** Sends the request and returns the full `{ data, meta, ... }` envelope. */
async function requestEnvelope<T>(
	path: string,
	opts: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
	const { method = "GET", body, auth = false, signal } = opts;

	let token: string | null = null;
	if (auth) {
		token = getAccessToken();
		if (!token) throw new ApiError("unauthorized", 401);
	}

	const build = (bearer: string | null): RequestInit => {
		const headers: Record<string, string> = {};
		if (body !== undefined) headers["Content-Type"] = "application/json";
		if (bearer) headers.Authorization = `Bearer ${bearer}`;
		return {
			method,
			headers,
			signal,
			...(body !== undefined ? { body: JSON.stringify(body) } : {}),
		};
	};

	const send = async (bearer: string | null): Promise<Response> => {
		try {
			return await fetch(`${API_BASE_URL}${path}`, build(bearer));
		} catch {
			throw new ApiError("network_error", 0);
		}
	};

	let res = await send(token);
	if (auth && res.status === 401) {
		const fresh = await refreshSession();
		if (fresh) res = await send(fresh);
	}

	const envelope = (await res
		.json()
		.catch(() => null)) as ApiEnvelope<T> | null;

	if (!res.ok || !envelope || envelope.success === false) {
		throw new ApiError(
			envelope?.message ?? "error",
			res.status,
			envelope?.errors,
		);
	}
	return envelope;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
	return (await requestEnvelope<T>(path, opts)).data;
}

/** Deduped single-flight token refresh: concurrent 401s share one refresh. */
let inFlight: Promise<string | null> | null = null;

function refreshSession(): Promise<string | null> {
	if (!inFlight) inFlight = doRefresh().finally(() => (inFlight = null));
	return inFlight;
}

async function doRefresh(): Promise<string | null> {
	const refreshToken = getRefreshToken();
	if (!refreshToken) {
		clearSession();
		return null;
	}
	try {
		const result = await apiPost<{ accessToken: string; refreshToken: string }>(
			"/app/auth/refresh",
			{ refreshToken },
		);
		storeSession(result);
		return result.accessToken;
	} catch (err) {
		if (isApiError(err) && err.status === 401) clearSession();
		return null;
	}
}

/** GET a (public by default) endpoint; pass `{ auth: true }` for a Bearer call. */
export function apiGet<T>(
	path: string,
	opts?: { auth?: boolean; signal?: AbortSignal },
): Promise<T> {
	return request<T>(path, { method: "GET", ...opts });
}

/**
 * GET a list endpoint and keep the envelope's `meta` (pagination + counts)
 * alongside `data`. Same auth/refresh behaviour as {@link apiGet}.
 */
export function apiGetEnvelope<T>(
	path: string,
	opts?: { auth?: boolean; signal?: AbortSignal },
): Promise<{ data: T; meta?: PageMeta }> {
	return requestEnvelope<T>(path, { method: "GET", ...opts });
}

/** POST JSON; pass `{ auth: true }` for a Bearer call. */
export function apiPost<T>(
	path: string,
	body: unknown,
	opts?: { auth?: boolean },
): Promise<T> {
	return request<T>(path, { method: "POST", body, ...opts });
}
