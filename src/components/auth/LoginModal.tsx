import { IonIcon, IonSpinner } from "@ionic/react";
import { arrowForward, closeOutline } from "ionicons/icons";
import { type FormEvent, useState } from "react";

import { OtpVerify } from "@/components/auth/OtpVerify";
import { PHONE_DIGITS, PhoneField } from "@/components/auth/PhoneField";
import { UI_MESSAGES } from "@/constants/messages";
import { checkPhone, otpLogin, requestOtp } from "@/lib/api/auth";
import { toastError, toastInfo, toastSuccess } from "@/lib/api/toast";
import { storeSession } from "@/lib/auth/session";

interface LoginPanelProps {
	/** Pre-fill the phone the user already typed elsewhere. */
	initialPhone?: string;
	onClose: () => void;
	/** Runs after a successful sign-in (session already stored). */
	onAuthenticated: () => void;
	/** Switch to the create-account popup, carrying the current phone across. */
	onSwitchToSignup: (phone: string) => void;
}

/**
 * Phone + OTP sign-in — the login popup's inner content. Mounted fresh each time
 * the popup opens (so state seeds from `initialPhone` with no reset effect); the
 * bottom-sheet shell + background live in the login gate. A number with no
 * account switches to the create-account popup with the number pre-filled.
 */
export function LoginPanel({
	initialPhone,
	onClose,
	onAuthenticated,
	onSwitchToSignup,
}: LoginPanelProps) {
	const [view, setView] = useState<"phone" | "otp">("phone");
	const [phone, setPhone] = useState(
		() => initialPhone?.replace(/\D/g, "").slice(0, PHONE_DIGITS) ?? "",
	);
	const [phoneError, setPhoneError] = useState<string | null>(null);
	const [verificationId, setVerificationId] = useState("");
	const [resendAfter, setResendAfter] = useState(60);
	const [otpError, setOtpError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submitPhone(event: FormEvent) {
		event.preventDefault();
		if (busy) return;
		if (phone.length !== PHONE_DIGITS) {
			setPhoneError("Enter a valid 10-digit phone number.");
			return;
		}
		setBusy(true);
		setPhoneError(null);
		try {
			const { exists } = await checkPhone(phone);
			if (!exists) {
				toastInfo(UI_MESSAGES.notRegistered);
				onSwitchToSignup(phone);
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
			toastSuccess(UI_MESSAGES.signedIn);
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
					<h1 className="text-[20px] font-bold leading-tight text-ink">
						Login
					</h1>
					<p className="mt-2 max-w-[340px] text-[12px] leading-[18px] text-muted">
						Sign in to access your leads, requirements, saved properties, and
						professional network.
					</p>

					<form onSubmit={submitPhone} className="mt-6">
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
							className="mt-4 flex h-[47px] w-full items-center justify-center gap-2 rounded-[8px] bg-primary text-[14px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
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
						Don&apos;t have an account?{" "}
						<button
							type="button"
							className="font-semibold text-primary"
							onClick={() => onSwitchToSignup(phone)}
						>
							Sign up now
						</button>
					</p>
				</>
			)}
		</>
	);
}
