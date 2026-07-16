import { isApiError } from "@/lib/api/errors";
import { notifyError, notifySuccess } from "@/lib/api/messages";

/**
 * Central "API response → toast" layer, mirroring the web's
 * `lib/api/middleware.ts`. Hooked into the API client's single request choke
 * point so success/error messages surface automatically and pages don't toast
 * by hand.
 *
 * Reads send an empty `message`, so `notifySuccessResponse` stays silent for
 * them without special-casing.
 */

/**
 * Endpoints whose messages are intentionally NOT auto-toasted (substring match):
 * plumbing, or flows that render their own inline feedback.
 *  - `otp` / `phone-status` / `phone-available`: the login/signup modals show
 *    inline errors and their own success toasts.
 *  - `auth/refresh`: silent token refresh.
 *  - `uploads`: presigned-upload plumbing (no user-facing message).
 *  - `shortlists`: the heart fill is the feedback; SaveButton handles its own
 *    error toast + optimistic revert.
 * Note: `PATCH /app/auth/me` (profile update) is deliberately NOT dismissed, so
 * `profile.updated` toasts.
 */
const DISMISSED_MESSAGE_URLS = [
	"/app/auth/otp",
	"/app/auth/phone-status",
	"/app/auth/phone-available",
	"/app/auth/refresh",
	"/app/uploads",
	"/app/shortlists",
];

function isDismissed(path: string): boolean {
	return DISMISSED_MESSAGE_URLS.some((u) => path.includes(u));
}

/** Toasts a successful response's message unless the URL is dismissed. */
export function notifySuccessResponse(
	path: string,
	message: string | undefined,
): void {
	if (isDismissed(path)) return;
	notifySuccess(message);
}

/**
 * Toasts an error response unless the URL is dismissed. A 401 on an AUTHED
 * request is session expiry (handled by refresh/redirect), so it's suppressed;
 * a 401 on an UNauthed request (e.g. a failed login) is shown.
 */
export function notifyErrorResponse(
	path: string,
	error: unknown,
	auth: boolean,
): void {
	if (isDismissed(path)) return;
	if (auth && isApiError(error) && error.isUnauthorized) return;
	notifyError(error);
}
