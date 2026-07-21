import { IonIcon, IonSpinner } from "@ionic/react";
import {
	arrowForward,
	chevronBackOutline,
	createOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";

import { OtpInput } from "@/components/auth/OtpInput";
import { formatPhone } from "@/lib/format";

/** Max OTP requests (initial send + resends) before the user must go back. */
const MAX_OTP_REQUESTS = 5;

interface OtpVerifyProps {
	/** Bare phone digits — formatted for display inside. */
	phone: string;
	/** Seconds until a resend is allowed, from the last `otp/request`. */
	resendAfter: number;
	submitting: boolean;
	/** Error message to show under the boxes (e.g. an invalid code). */
	errorText?: string | null;
	submitLabel?: string;
	otpLength?: number;
	/** Verify the code. Resolve `true` on success (screen navigates away),
	 *  `false` to keep the user here and clear the boxes. */
	onVerify: (code: string) => Promise<boolean>;
	/** Request a fresh code; resolve with the new resend cooldown (seconds). */
	onResend: () => Promise<number>;
	/** Go back to edit the phone number. */
	onChangeNumber: () => void;
}

/**
 * The phone-OTP verification step, shared by the login and signup screens:
 * segmented code entry, a resend countdown, and verify/back controls. Owns the
 * code + countdown; the parent supplies the verify/resend calls.
 */
export function OtpVerify({
	phone,
	resendAfter,
	submitting,
	errorText,
	submitLabel = "Verify & continue",
	otpLength = 4,
	onVerify,
	onResend,
	onChangeNumber,
}: OtpVerifyProps) {
	const [code, setCode] = useState("");
	const [secondsLeft, setSecondsLeft] = useState(resendAfter);
	// Cap the total number of code requests (mirrors the web's DEFAULT_MAX_REQUESTS).
	// The initial send that brought the user here counts as request #1.
	const [requestCount, setRequestCount] = useState(1);
	const capReached = requestCount >= MAX_OTP_REQUESTS;

	useEffect(() => {
		const id = setInterval(
			() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)),
			1000,
		);
		return () => clearInterval(id);
	}, []);

	async function submit(value: string) {
		if (submitting || value.length < otpLength) return;
		const ok = await onVerify(value);
		if (!ok) setCode("");
	}

	async function resend() {
		if (secondsLeft > 0 || submitting || capReached) return;
		try {
			setSecondsLeft(await onResend());
			setRequestCount((count) => count + 1);
			setCode("");
		} catch {
			/* the parent surfaces resend failures via a toast */
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={onChangeNumber}
				aria-label="Back"
				className="-ml-2 mb-2 flex h-9 w-9 items-center justify-center rounded-full text-ink active:bg-black/5"
			>
				<IonIcon icon={chevronBackOutline} className="text-2xl" />
			</button>

			<h1 className="text-[20px] font-bold leading-tight text-ink">
				Verify your number
			</h1>
			<p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-light">
				<span>
					Enter the {otpLength}-digit code sent to{" "}
					<span className="font-semibold text-ink">{formatPhone(phone)}</span>
				</span>
				<button
					type="button"
					onClick={onChangeNumber}
					aria-label="Change number"
					className="text-primary"
				>
					<IonIcon icon={createOutline} className="text-base" />
				</button>
			</p>

			<div className="mt-8">
				<OtpInput
					value={code}
					onChange={setCode}
					onComplete={submit}
					length={otpLength}
					disabled={submitting}
					autoFocus
				/>
				{errorText ? (
					<p className="mt-3 text-sm text-danger">{errorText}</p>
				) : null}

				<p className="mt-4 text-sm text-muted-light">
					{capReached ? (
						<>
							No attempts left.{" "}
							<button
								type="button"
								onClick={onChangeNumber}
								className="font-bold text-primary"
							>
								Change number
							</button>{" "}
							to try again.
						</>
					) : (
						<>
							Didn&apos;t get the code?{" "}
							<button
								type="button"
								onClick={resend}
								disabled={secondsLeft > 0 || submitting}
								className="font-bold text-primary disabled:font-semibold disabled:text-muted-light"
							>
								{secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend"}
							</button>
						</>
					)}
				</p>

				<button
					type="button"
					onClick={() => void submit(code)}
					disabled={submitting || code.length < otpLength}
					className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-[15px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-50"
				>
					{submitting ? (
						<IonSpinner name="crescent" className="h-5 w-5" />
					) : (
						<>
							{submitLabel}
							<IonIcon icon={arrowForward} className="text-lg" />
						</>
					)}
				</button>
			</div>
		</>
	);
}
