import { apiPost } from "@/lib/api/client";
import type { Session } from "@/lib/auth/session";

/**
 * App (normal-user) OTP auth — thin typed wrappers over the `/app/auth/*`
 * routes, mirroring the web app (`lib/api/auth.ts`). No passwords: request a
 * code, then verify it with `otp/login` (existing users) or `otp/register`
 * (new users). Same request/response shapes as the web client.
 */

/** Public shape of the signed-in user (password stripped by the API). */
export interface AuthUser {
	id: string;
	phone: string | null;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	userType: string | null;
	profilePhoto: string | null;
	city: string | null;
	state: string | null;
	about: string | null;
	businessName: string | null;
	isProfileCompleted?: boolean;
}

/** Login/register/refresh result: the session tokens plus the user. */
export interface LoginResult extends Session {
	user: AuthUser;
}

/** A friendly display name: full name, else business name, else phone. */
export function userDisplayName(user: AuthUser): string {
	const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
	return full || user.businessName || user.phone || "Account";
}

/** Whether a phone already belongs to a user (drives login vs register). */
export function checkPhone(phone: string): Promise<{ exists: boolean }> {
	return apiPost<{ exists: boolean }>("/app/auth/phone-status", { phone });
}

/**
 * Send an OTP to a phone. Returns `verificationId` (bound to the phone for the
 * verify step) and `resendAfter` — seconds until a fresh code can be requested.
 */
export function requestOtp(
	phone: string,
): Promise<{ verificationId: string; resendAfter: number }> {
	return apiPost<{ verificationId: string; resendAfter: number }>(
		"/app/auth/otp/request",
		{ phone },
	);
}

interface VerifyInput {
	phone: string;
	code: string;
	verificationId: string;
}

/** Signup payload: the verification fields plus the profile the form collects. */
export interface RegisterInput extends VerifyInput {
	userType?: string;
	firstName?: string;
	lastName?: string;
	acceptedTerms?: boolean;
	address?: string;
	/** Professional's single category id. */
	professionalCategoryId?: number;
	/** Material supplier's selected product-category ids. */
	supplierProductIds?: number[];
}

/** OTP login (existing users only) — verify the code and return a session. */
export function otpLogin(input: VerifyInput): Promise<LoginResult> {
	return apiPost<LoginResult>("/app/auth/otp/login", input);
}

/**
 * OTP signup (new phones) — verify the code, create a passwordless account with
 * the collected profile, and return a session. Geo/category fields the web
 * derives from address autocomplete are omitted; they're filled in later from
 * the Profile screen.
 */
export function otpRegister(input: RegisterInput): Promise<LoginResult> {
	return apiPost<LoginResult>("/app/auth/otp/register", input);
}
