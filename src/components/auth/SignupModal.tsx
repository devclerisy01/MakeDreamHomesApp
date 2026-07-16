import { IonIcon, IonSpinner } from "@ionic/react";
import { arrowForward, checkmarkOutline, closeOutline } from "ionicons/icons";
import { type FormEvent, useEffect, useState } from "react";

import { OtpVerify } from "@/components/auth/OtpVerify";
import { PHONE_DIGITS, PhoneField } from "@/components/auth/PhoneField";
import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { CategoryChips } from "@/components/common/CategoryChips";
import { TextField } from "@/components/common/TextField";
import { UI_MESSAGES } from "@/constants/messages";
import type { AddressResult } from "@/lib/api/places";
import { checkPhone, otpRegister, requestOtp } from "@/lib/api/auth";
import {
	type CategoryOption,
	getMaterialCategories,
	getProfessionalCategories,
} from "@/lib/api/misc";
import { toastError, toastInfo, toastSuccess } from "@/lib/api/toast";
import { storeSession } from "@/lib/auth/session";

type RoleId = "user" | "professional" | "dealer" | "supplier";

const ROLES: { id: RoleId; label: string; userType: string }[] = [
	{ id: "user", label: "User", userType: "person" },
	{ id: "professional", label: "Professional", userType: "professional" },
	{ id: "dealer", label: "Property Dealer", userType: "dealer" },
	{ id: "supplier", label: "Material Supplier", userType: "supplier" },
];

interface SignupPanelProps {
	/** Pre-fill the phone carried over from the login popup. */
	initialPhone?: string;
	onClose: () => void;
	/** Runs after a successful sign-up (session already stored). */
	onAuthenticated: () => void;
	/** Switch to the login popup, carrying the current phone across. */
	onSwitchToLogin: (phone: string) => void;
}

/**
 * Create-an-account — the sign-up popup's inner content. Mounted fresh each time
 * the popup opens (state seeds from `initialPhone`); the bottom-sheet shell +
 * background live in the login gate. Registers via the same
 * `/app/auth/otp/register` endpoint the web uses; an already-registered number
 * switches to the login popup.
 */
export function SignupPanel({
	initialPhone,
	onClose,
	onAuthenticated,
	onSwitchToLogin,
}: SignupPanelProps) {
	const [role, setRole] = useState<RoleId>("user");
	const [phone, setPhone] = useState(
		() => initialPhone?.replace(/\D/g, "").slice(0, PHONE_DIGITS) ?? "",
	);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [address, setAddress] = useState("");
	// Structured parts from the last autocomplete selection (so the new user gets
	// a resolved location_id + city/state — needed to appear in the directory).
	const [addressMeta, setAddressMeta] = useState<AddressResult | null>(null);
	const [acceptedTerms, setAcceptedTerms] = useState(false);

	// Category picker (professional trade / supplier products), like the web form.
	const [proOptions, setProOptions] = useState<CategoryOption[]>([]);
	const [supplierOptions, setSupplierOptions] = useState<CategoryOption[]>([]);
	const [proCategory, setProCategory] = useState<number | null>(null);
	const [supplierCats, setSupplierCats] = useState<number[]>([]);

	const [phoneError, setPhoneError] = useState<string | null>(null);
	const [termsError, setTermsError] = useState<string | null>(null);
	const [categoriesError, setCategoriesError] = useState<string | null>(null);
	const [otpError, setOtpError] = useState<string | null>(null);
	const [view, setView] = useState<"form" | "otp">("form");
	const [verificationId, setVerificationId] = useState("");
	const [resendAfter, setResendAfter] = useState(60);
	const [busy, setBusy] = useState(false);

	const userType = ROLES.find((r) => r.id === role)?.userType ?? "person";

	// Load the picker options once (public); ignored for User / Property Dealer.
	useEffect(() => {
		const controller = new AbortController();
		getProfessionalCategories(controller.signal)
			.then((options) => setProOptions(options))
			.catch(() => {});
		getMaterialCategories(controller.signal)
			.then((options) => setSupplierOptions(options))
			.catch(() => {});
		return () => controller.abort();
	}, []);

	async function submitForm(event: FormEvent) {
		event.preventDefault();
		if (busy) return;
		let invalid = false;
		if (phone.length !== PHONE_DIGITS) {
			setPhoneError("Enter a valid 10-digit mobile number.");
			invalid = true;
		}
		if (!acceptedTerms) {
			setTermsError("Please accept the terms to continue.");
			invalid = true;
		}
		if (role === "professional" && proCategory === null) {
			setCategoriesError("Please select your profession.");
			invalid = true;
		}
		if (role === "supplier" && supplierCats.length === 0) {
			setCategoriesError("Please select at least one product category.");
			invalid = true;
		}
		if (invalid) return;

		setBusy(true);
		setPhoneError(null);
		try {
			const { exists } = await checkPhone(phone);
			if (exists) {
				toastInfo(UI_MESSAGES.numberRegistered);
				onSwitchToLogin(phone);
				return;
			}
			const otp = await requestOtp(phone);
			setVerificationId(otp.verificationId);
			setResendAfter(otp.resendAfter);
			setOtpError(null);
			setView("otp");
		} catch {
			setPhoneError("Couldn't send the code. Please try again.");
		} finally {
			setBusy(false);
		}
	}

	async function verify(code: string): Promise<boolean> {
		setBusy(true);
		setOtpError(null);
		try {
			const result = await otpRegister({
				phone,
				code,
				verificationId,
				userType,
				firstName: firstName.trim() || undefined,
				lastName: lastName.trim() || undefined,
				acceptedTerms,
				address: (addressMeta?.address || address).trim() || undefined,
				locality: addressMeta?.locality,
				city: addressMeta?.city,
				state: addressMeta?.state,
				pincode: addressMeta?.pincode,
				latitude: addressMeta?.latitude,
				longitude: addressMeta?.longitude,
				professionalCategoryId:
					role === "professional" ? (proCategory ?? undefined) : undefined,
				supplierProductIds:
					role === "supplier" && supplierCats.length > 0
						? supplierCats
						: undefined,
			});
			storeSession(result);
			toastSuccess(UI_MESSAGES.accountCreated);
			onAuthenticated();
			return true;
		} catch {
			setOtpError("That code is invalid or expired. Please try again.");
			return false;
		} finally {
			setBusy(false);
		}
	}

	async function resend(): Promise<number> {
		try {
			const otp = await requestOtp(phone);
			setVerificationId(otp.verificationId);
			toastInfo(UI_MESSAGES.codeSent);
			return otp.resendAfter;
		} catch {
			toastError(UI_MESSAGES.codeResendFailed);
			throw new Error("resend failed");
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={onClose}
				aria-label="Close"
				className="-mr-2 mb-1 flex h-9 w-9 items-center justify-center self-end rounded-full text-muted-light active:bg-black/5"
			>
				<IonIcon icon={closeOutline} className="text-2xl" />
			</button>

			{view === "otp" ? (
				<OtpVerify
					phone={phone}
					resendAfter={resendAfter}
					submitting={busy}
					errorText={otpError}
					submitLabel="Create account"
					onVerify={verify}
					onResend={resend}
					onChangeNumber={() => {
						setView("form");
						setOtpError(null);
					}}
				/>
			) : (
				<>
					<h1 className="text-[20px] font-bold leading-tight text-ink">
						Create an Account
					</h1>
					<p className="mt-2 text-[12px] leading-[18px] text-muted">
						Tell us what you need — post your requirement
					</p>

					<form onSubmit={submitForm} className="mt-5 flex flex-col gap-3.5">
						{/* Account-type pill selector (User / Professional / …). */}
						<div
							role="radiogroup"
							aria-label="Account type"
							className="flex w-full items-center justify-between rounded-full border border-primary bg-white p-1"
						>
							{ROLES.map((option) => {
								const selected = option.id === role;
								return (
									<button
										key={option.id}
										type="button"
										role="radio"
										aria-checked={selected}
										onClick={() => {
											setRole(option.id);
											setCategoriesError(null);
										}}
										className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
											selected ? "bg-primary text-white" : "text-ink"
										}`}
									>
										{option.label}
									</button>
								);
							})}
						</div>

						<PhoneField
							value={phone}
							onChange={(digits) => {
								setPhone(digits);
								if (phoneError) setPhoneError(null);
							}}
							error={phoneError}
							disabled={busy}
						/>

						<div className="grid grid-cols-2 gap-3">
							<TextField
								value={firstName}
								onChange={setFirstName}
								placeholder="First Name"
								autoCapitalize="words"
								disabled={busy}
							/>
							<TextField
								value={lastName}
								onChange={setLastName}
								placeholder="Last Name"
								autoCapitalize="words"
								disabled={busy}
							/>
						</div>

						{role === "professional" ? (
							<div className="flex flex-col gap-2">
								<span className="text-sm font-semibold text-ink">
									Type of Professional
								</span>
								<CategoryChips
									options={proOptions}
									selected={proCategory !== null ? [proCategory] : []}
									single
									disabled={busy}
									error={categoriesError}
									onChange={(ids) => {
										setProCategory(ids[0] ?? null);
										if (categoriesError) setCategoriesError(null);
									}}
								/>
							</div>
						) : null}

						{role === "supplier" ? (
							<div className="flex flex-col gap-2">
								<span className="text-sm font-semibold text-ink">
									Product Categories
								</span>
								<CategoryChips
									options={supplierOptions}
									selected={supplierCats}
									disabled={busy}
									error={categoriesError}
									onChange={(ids) => {
										setSupplierCats(ids);
										if (categoriesError) setCategoriesError(null);
									}}
								/>
							</div>
						) : null}

						<AddressAutocomplete
							value={address}
							ariaLabel="Address"
							placeholder="Search your address"
							enableCurrentLocation
							onChange={(value) => {
								setAddress(value);
								// A manual edit invalidates the last resolved selection.
								setAddressMeta(null);
							}}
							onSelect={(result) => {
								setAddress(result.full);
								setAddressMeta(result);
							}}
						/>

						<div>
							<button
								type="button"
								role="checkbox"
								aria-checked={acceptedTerms}
								onClick={() => {
									setAcceptedTerms((v) => !v);
									if (termsError) setTermsError(null);
								}}
								className="flex items-start gap-2.5 text-left"
							>
								<span
									className={`mt-px grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border ${
										acceptedTerms
											? "border-primary bg-primary text-white"
											: "border-[#dae3ef] bg-white"
									}`}
								>
									{acceptedTerms ? (
										<IonIcon icon={checkmarkOutline} className="text-[11px]" />
									) : null}
								</span>
								<span className="text-[11px] leading-[16px] text-ink">
									I agree to the{" "}
									<span className="font-bold">Terms &amp; Conditions</span> and{" "}
									<span className="font-bold">Privacy Policy</span>.
								</span>
							</button>
							{termsError ? (
								<p className="mt-1.5 text-sm text-danger">{termsError}</p>
							) : null}
						</div>

						<button
							type="submit"
							disabled={busy}
							className="mt-1 flex h-[47px] w-full items-center justify-center gap-2 rounded-[8px] bg-primary text-[14px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
						>
							{busy ? (
								<IonSpinner name="crescent" className="h-5 w-5" />
							) : (
								<>
									Continue
									<IonIcon icon={arrowForward} className="text-base" />
								</>
							)}
						</button>
					</form>

					<p className="mt-5 text-center text-[12px] text-muted">
						Already have an account?{" "}
						<button
							type="button"
							className="font-bold text-primary"
							onClick={() => onSwitchToLogin(phone)}
						>
							Sign in
						</button>
					</p>
				</>
			)}
		</>
	);
}
