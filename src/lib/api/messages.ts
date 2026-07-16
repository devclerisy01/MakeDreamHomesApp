import { ApiError, isApiError } from "@/lib/api/errors";
import { presentToast } from "@/lib/api/toast";

/**
 * Maps the API's message KEYS (dot-notation returned in the response envelope's
 * `message`, e.g. `auth.loginSuccess`) to user-facing English text. The app is
 * English-only, so this replaces the web's next-intl bridge. Wording mirrors the
 * web's `success_messages.*` / `error_messages.*` translations verbatim.
 *
 * Unknown keys fall back to the raw string (see {@link resolveMessage}), so a
 * plain-English message from the API still shows sensibly.
 */
const MESSAGE_TEXT: Readonly<Record<string, string>> = {
	// success
	"auth.loginSuccess": "You're signed in. Welcome back!",
	"auth.signupSuccess": "Welcome! Your account has been created.",
	"auth.otpSent": "A verification code has been sent to your phone.",
	"auth.loggedOut": "You've been logged out.",
	"profile.updated": "Your profile has been updated.",
	"leads.requirementSubmitted":
		"Your requirement has been submitted successfully.",
	"reviews.submitted": "Review submitted — it'll appear once approved.",
	"shortlist.users.saved": "Profile added to your saved list.",
	"shortlist.users.removed": "Profile removed from your saved list.",
	"shortlist.leads.saved": "Lead added to your saved list.",
	"shortlist.leads.removed": "Lead removed from your saved list.",
	"portfolio.created": "Portfolio item added — it'll appear once approved.",
	"portfolio.updated": "Portfolio item updated — it'll appear once approved.",
	"portfolio.deleted": "Portfolio item removed.",
	"property.created": "Property listing added.",
	"property.updated": "Property listing updated.",
	"property.deleted": "Property listing removed.",

	// errors
	"auth.phoneTaken": "This phone number is already registered.",
	"auth.emailTaken": "This email is already in use.",
	"auth.accountNotFound": "No account found for this phone number.",
	"auth.otpInvalid": "The code you entered is incorrect or has expired.",
	"auth.otpCooldown":
		"Please wait a few seconds before requesting another code.",
	"auth.otpMaxRequests":
		"You've requested too many codes. Please try again later.",
	"auth.otpSendFailed":
		"Could not send the code. Please try again in a moment.",
	"auth.invalidRefreshToken": "Your session has expired. Please sign in again.",
	"auth.unauthorized": "Please sign in to continue.",
	"portfolio.notFound": "Portfolio item not found.",
	"property.notFound": "Property listing not found.",

	// client-side sentinels thrown by the API client
	network_error: "Network error — please check your connection.",
	upload_failed: "Upload failed. Please try again.",
	unauthorized: "Please sign in to continue.",
	error: "Something went wrong. Please try again.",
};

/**
 * Resolves an API message key (or a raw string) to display text. Falls back to
 * the input unchanged when it isn't a known key — matching the web translator's
 * behaviour, so plain-English API messages pass through.
 */
export function resolveMessage(key: string | undefined | null): string {
	if (!key) return "";
	return MESSAGE_TEXT[key] ?? key;
}

/**
 * Pulls a human-readable message out of an error. Prefers class-validator field
 * messages carried on `ApiError.details` (joined), else the resolved error
 * message, else a generic fallback.
 */
function errorText(error: unknown): string {
	if (isApiError(error)) {
		const fromDetails = validationText(error.details);
		if (fromDetails) return fromDetails;
		return resolveMessage(error.message);
	}
	return resolveMessage("error");
}

/** Flattens class-validator error payloads (`string[]` or `{message}[]`). */
function validationText(details: unknown): string | null {
	if (!details) return null;
	const list = Array.isArray(details) ? details : [details];
	const parts = list
		.map((item) => {
			if (typeof item === "string") return item;
			if (item && typeof item === "object" && "message" in item) {
				const m = (item as { message?: unknown }).message;
				return typeof m === "string" ? m : null;
			}
			return null;
		})
		.filter((s): s is string => Boolean(s));
	return parts.length ? parts.join(" ") : null;
}

/** Toasts a success message for the given API key (no-op when key is empty). */
export function notifySuccess(key: string | undefined | null): void {
	const text = resolveMessage(key);
	if (text) void presentToast(text, "success");
}

/** Toasts an error message derived from an API error / thrown value. */
export function notifyError(error: unknown): void {
	const text = errorText(error);
	if (text) void presentToast(text, "error");
}

export { ApiError };
