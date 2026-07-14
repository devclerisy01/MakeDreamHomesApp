import {
	IonContent,
	IonIcon,
	IonPage,
	IonSpinner,
	useIonRouter,
	useIonToast,
} from "@ionic/react";
import {
	arrowForward,
	checkmarkOutline,
	chevronBackOutline,
} from "ionicons/icons";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { LoginArt } from "@/components/auth/LoginArt";
import { OtpVerify } from "@/components/auth/OtpVerify";
import { PHONE_DIGITS, PhoneField } from "@/components/auth/PhoneField";
import { CategoryChips } from "@/components/common/CategoryChips";
import { TextField } from "@/components/common/TextField";
import { ROUTES } from "@/constants/routes";
import { checkPhone, otpRegister, requestOtp } from "@/lib/api/auth";
import { useLogin } from "@/lib/auth/login-gate";
import {
	type CategoryOption,
	getMaterialCategories,
	getProfessionalCategories,
} from "@/lib/api/misc";
import { storeSession } from "@/lib/auth/session";

type RoleId = "user" | "professional" | "dealer" | "supplier";

const ROLES: { id: RoleId; label: string; userType: string }[] = [
	{ id: "user", label: "User", userType: "person" },
	{ id: "professional", label: "Professional", userType: "professional" },
	{ id: "dealer", label: "Property Dealer", userType: "dealer" },
	{ id: "supplier", label: "Material Supplier", userType: "supplier" },
];

function safeReturnTo(raw: string | null): string | null {
	return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

/**
 * Create-an-account screen: pick a role, enter phone + name, choose a category
 * (professionals/suppliers), add an address, accept the terms, then verify by
 * OTP. Registers via the same `/app/auth/otp/register` endpoint the web app
 * uses; an already-registered number is sent to Sign in.
 */
export default function Signup() {
	const router = useIonRouter();
	const { openLogin } = useLogin();
	const [present] = useIonToast();
	const { search } = useLocation();
	const query = useMemo(() => new URLSearchParams(search), [search]);
	const returnTo = safeReturnTo(query.get("returnTo"));

	const [role, setRole] = useState<RoleId>("user");
	const [phone, setPhone] = useState(
		() => query.get("phone")?.replace(/\D/g, "").slice(0, PHONE_DIGITS) ?? "",
	);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [address, setAddress] = useState("");
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
				void present({
					message: "This number already has an account. Please sign in.",
					duration: 2200,
					position: "top",
				});
				openLogin({
					phone,
					onAuthenticated: () =>
						router.push(returnTo ?? ROUTES.home, "root", "replace"),
				});
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
				address: address.trim() || undefined,
				professionalCategoryId:
					role === "professional" ? (proCategory ?? undefined) : undefined,
				supplierProductIds:
					role === "supplier" && supplierCats.length > 0
						? supplierCats
						: undefined,
			});
			storeSession(result);
			void present({
				message: "Account created successfully.",
				duration: 1500,
				position: "top",
				color: "success",
			});
			router.push(returnTo ?? ROUTES.home, "root", "replace");
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
			void present({
				message: "A new code has been sent.",
				duration: 1500,
				position: "top",
			});
			return otp.resendAfter;
		} catch {
			void present({
				message: "Couldn't resend the code. Try again shortly.",
				duration: 1800,
				position: "top",
				color: "danger",
			});
			throw new Error("resend failed");
		}
	}

	return (
		<IonPage>
			<IonContent
				style={{
					"--background":
						"linear-gradient(180deg,#eaf0fc 0%,#f4f7fd 42%,#eaf0fc 100%)",
				}}
			>
				{/* Decorative house/pin scene anchored to the bottom (matches design). */}
				<LoginArt className="pointer-events-none absolute inset-x-0 bottom-0 z-0 w-full" />

				<div className="relative z-10 mx-auto flex min-h-full w-full max-w-[460px] flex-col px-6 pb-[210px] pt-[calc(env(safe-area-inset-top)+1.25rem)]">
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
							<button
								type="button"
								onClick={() => router.push(ROUTES.home, "root", "replace")}
								aria-label="Back to home"
								className="-ml-2 mb-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-light active:bg-black/5"
							>
								<IonIcon icon={chevronBackOutline} className="text-2xl" />
							</button>

							<h1 className="text-[28px] font-bold leading-tight text-ink">
								Create an Account
							</h1>
							<p className="mt-2 text-sm leading-relaxed text-muted-light">
								Tell us what you need — post your requirement
							</p>

							<form onSubmit={submitForm} className="mt-6 flex flex-col gap-4">
								{/* Account-type pill selector (User / Professional / …). */}
								<div
									role="radiogroup"
									aria-label="Account type"
									className="flex w-full items-center justify-between rounded-full border border-line bg-white p-1"
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
												className={`whitespace-nowrap rounded-full px-2 py-2 text-[10.5px] font-semibold transition-colors ${
													selected ? "bg-primary text-white" : "text-muted"
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

								<TextField
									value={address}
									onChange={setAddress}
									placeholder="Address"
									multiline
									rows={4}
									disabled={busy}
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
											className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
												acceptedTerms
													? "border-primary bg-primary text-white"
													: "border-line bg-white"
											}`}
										>
											{acceptedTerms ? (
												<IonIcon icon={checkmarkOutline} className="text-sm" />
											) : null}
										</span>
										<span className="text-[13px] leading-snug text-muted">
											I agree to the{" "}
											<span className="font-bold text-ink">
												Terms &amp; Conditions
											</span>{" "}
											and{" "}
											<span className="font-bold text-ink">Privacy Policy</span>
											.
										</span>
									</button>
									{termsError ? (
										<p className="mt-1.5 text-sm text-danger">{termsError}</p>
									) : null}
								</div>

								<button
									type="submit"
									disabled={busy}
									className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-[15px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
								>
									{busy ? (
										<IonSpinner name="crescent" className="h-5 w-5" />
									) : (
										<>
											Continue
											<IonIcon icon={arrowForward} className="text-lg" />
										</>
									)}
								</button>
							</form>

							<p className="mt-5 text-center text-sm text-muted">
								Already have an account?{" "}
								<button
									type="button"
									className="font-bold text-primary"
									onClick={() =>
										openLogin({
											phone,
											onAuthenticated: () =>
												router.push(returnTo ?? ROUTES.home, "root", "replace"),
										})
									}
								>
									Sign in
								</button>
							</p>
						</>
					)}
				</div>
			</IonContent>
		</IonPage>
	);
}
