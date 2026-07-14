import {
	IonContent,
	IonIcon,
	IonPage,
	IonSpinner,
	useIonRouter,
	useIonToast,
} from "@ionic/react";
import { arrowForward, homeOutline } from "ionicons/icons";
import { type FormEvent, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { OtpVerify } from "@/components/auth/OtpVerify";
import { PHONE_DIGITS, PhoneField } from "@/components/auth/PhoneField";
import { registerHref, ROUTES } from "@/constants/routes";
import { checkPhone, otpLogin, requestOtp } from "@/lib/api/auth";
import { storeSession } from "@/lib/auth/session";

function safeReturnTo(raw: string | null): string | null {
	return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

/**
 * Phone + OTP sign-in for existing users, using the same `/app/auth/*` endpoints
 * as the web app. A number with no account is sent to signup (with the number
 * pre-filled); a verified code stores the session and lands on the return page.
 */
export default function Login() {
	const router = useIonRouter();
	const [present] = useIonToast();
	const { search } = useLocation();
	const query = useMemo(() => new URLSearchParams(search), [search]);
	const returnTo = safeReturnTo(query.get("returnTo"));

	const [view, setView] = useState<"phone" | "otp">("phone");
	const [phone, setPhone] = useState(
		() => query.get("phone")?.replace(/\D/g, "").slice(0, PHONE_DIGITS) ?? "",
	);
	const [phoneError, setPhoneError] = useState<string | null>(null);
	const [verificationId, setVerificationId] = useState("");
	const [resendAfter, setResendAfter] = useState(60);
	const [otpError, setOtpError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	function goToSignup() {
		router.push(
			registerHref({ phone, returnTo: returnTo ?? undefined }),
			"forward",
			"push",
		);
	}

	async function submitPhone(event: FormEvent) {
		event.preventDefault();
		if (busy) return;
		if (phone.length !== PHONE_DIGITS) {
			setPhoneError("Enter a valid 10-digit mobile number.");
			return;
		}
		setBusy(true);
		setPhoneError(null);
		try {
			const { exists } = await checkPhone(phone);
			if (!exists) {
				void present({
					message: "This number isn't registered. Let's create your account.",
					duration: 2200,
					position: "top",
				});
				goToSignup();
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
			const result = await otpLogin({ phone, code, verificationId });
			storeSession(result);
			void present({
				message: "Signed in successfully.",
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
			<IonContent>
				<div className="mx-auto flex min-h-full w-full max-w-[460px] flex-col px-6 pb-8 pt-[calc(env(safe-area-inset-top)+2.5rem)]">
					{view === "otp" ? (
						<OtpVerify
							phone={phone}
							resendAfter={resendAfter}
							submitting={busy}
							errorText={otpError}
							submitLabel="Sign in"
							onVerify={verify}
							onResend={resend}
							onChangeNumber={() => {
								setView("phone");
								setOtpError(null);
							}}
						/>
					) : (
						<>
							<button
								type="button"
								onClick={() => router.push(ROUTES.home, "root", "replace")}
								aria-label="Go to home"
								className="-ml-2 mb-3 flex h-9 w-9 items-center justify-center rounded-full text-ink active:bg-black/5"
							>
								<IonIcon icon={homeOutline} className="text-2xl" />
							</button>

							<h1 className="text-[28px] font-bold leading-tight text-ink">
								Login
							</h1>
							<p className="mt-2 max-w-[340px] text-sm leading-relaxed text-muted-light">
								Sign in to access your leads, requirements, saved properties,
								and professional network.
							</p>

							<form onSubmit={submitPhone} className="mt-8">
								<PhoneField
									value={phone}
									onChange={(digits) => {
										setPhone(digits);
										if (phoneError) setPhoneError(null);
									}}
									error={phoneError}
									autoFocus
									disabled={busy}
								/>
								<button
									type="submit"
									disabled={busy}
									className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-[15px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
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
								Don&apos;t have an account?{" "}
								<button
									type="button"
									className="font-bold text-primary"
									onClick={goToSignup}
								>
									Sign up now
								</button>
							</p>
						</>
					)}
				</div>
			</IonContent>
		</IonPage>
	);
}
