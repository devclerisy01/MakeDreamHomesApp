import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { uploadImageViaPresign } from "@/lib/api/uploads";
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
	firstName: string | null;
	lastName: string | null;
	gender: string | null;
	userType: string | null;
	profilePhoto: string | null;
	address: string | null;
	locality: string | null;
	city: string | null;
	state: string | null;
	pincode: string | null;
	about: string | null;
	experience: string | null;
	businessName: string | null;
	/** Selected professional-category id (professionals only). */
	professionalUserType?: string | number | null;
	/** Material supplier's selected product ids. */
	supplierProductIds?: number[];
	/** Aggregate counts the API precomputes for the profile dashboard. */
	portfolioCount?: number;
	leadCount?: number;
	reviewCount?: number;
	isProfileCompleted?: boolean;
}

/** Login/register/refresh result: the session tokens plus the user. */
export interface LoginResult extends Session {
	user: AuthUser;
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
	/** Structured address parts from the Google Places autocomplete selection. */
	locality?: string;
	city?: string;
	state?: string;
	pincode?: string;
	latitude?: string;
	longitude?: string;
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
 * the collected profile (name, address parts, role category), and return a
 * session.
 */
export function otpRegister(input: RegisterInput): Promise<LoginResult> {
	return apiPost<LoginResult>("/app/auth/otp/register", input);
}

/** The current signed-in user, fresh from the API (validates the token). */
export function me(): Promise<AuthUser> {
	return apiGet<AuthUser>("/app/auth/me", { auth: true });
}

/** Fields a user can edit from their profile (all optional; sent only if changed). */
export interface UpdateProfilePayload {
	firstName?: string;
	lastName?: string;
	gender?: string;
	address?: string;
	locality?: string;
	city?: string;
	state?: string;
	pincode?: string;
	latitude?: string;
	longitude?: string;
	profilePhoto?: string;
	about?: string;
	experience?: string;
	professionalCategoryId?: number;
	businessName?: string;
	businessGstin?: string;
	supplierProductIds?: number[];
}

/** Updates the signed-in user's profile (`PATCH /app/auth/me`); returns the fresh user. */
export function updateProfile(
	payload: UpdateProfilePayload,
): Promise<AuthUser> {
	return apiPatch<AuthUser>("/app/auth/me", payload);
}

/**
 * Uploads a profile photo directly to storage via a presigned URL and returns
 * the bucket-relative KEY to persist (`updateProfile({ profilePhoto: key })`).
 * The API resolves the key to a loadable URL when it serves the user, so reads
 * work without ever storing a URL.
 */
export function uploadProfileImage(file: File): Promise<string> {
	return uploadImageViaPresign(file, "profile");
}
