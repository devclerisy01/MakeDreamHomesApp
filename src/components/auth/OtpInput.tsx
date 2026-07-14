import {
	type ClipboardEvent,
	type KeyboardEvent,
	useEffect,
	useRef,
} from "react";

interface OtpInputProps {
	/** Current code (0–`length` digits). Fully controlled by the parent. */
	value: string;
	onChange: (next: string) => void;
	/** Fired once all `length` digits are entered. */
	onComplete: (code: string) => void;
	length?: number;
	disabled?: boolean;
	autoFocus?: boolean;
}

/**
 * Segmented OTP entry (default 4 boxes) with auto-advance, backspace-to-
 * previous, and paste support — mirrors the web `OtpModal` inputs. Controlled:
 * the parent clears it by setting `value=""` (e.g. on an invalid code).
 */
export function OtpInput({
	value,
	onChange,
	onComplete,
	length = 4,
	disabled,
	autoFocus,
}: OtpInputProps) {
	const inputs = useRef<Array<HTMLInputElement | null>>([]);

	useEffect(() => {
		if (autoFocus) inputs.current[0]?.focus();
	}, [autoFocus]);

	const digits = Array.from({ length }, (_, i) => value[i] ?? "");

	function commit(next: string) {
		onChange(next);
		if (next.length === length) onComplete(next);
	}

	function setDigit(index: number, raw: string) {
		const digit = raw.replace(/\D/g, "").slice(-1);
		const arr = [...digits];
		arr[index] = digit;
		const next = arr.join("").slice(0, length);
		commit(next);
		if (digit && index < length - 1) inputs.current[index + 1]?.focus();
	}

	function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Backspace" && !digits[index] && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	}

	function onPaste(event: ClipboardEvent<HTMLInputElement>) {
		const pasted = event.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, length);
		if (!pasted) return;
		event.preventDefault();
		commit(pasted);
		inputs.current[Math.min(pasted.length, length - 1)]?.focus();
	}

	return (
		<div className="flex justify-start gap-3">
			{digits.map((digit, i) => (
				<input
					key={i}
					ref={(el) => {
						inputs.current[i] = el;
					}}
					inputMode="numeric"
					maxLength={1}
					value={digit}
					disabled={disabled}
					onChange={(event) => setDigit(i, event.target.value)}
					onKeyDown={(event) => onKeyDown(i, event)}
					onPaste={onPaste}
					aria-label={`Digit ${i + 1}`}
					className="h-14 w-14 rounded-xl border border-line bg-white text-center text-2xl font-bold text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
				/>
			))}
		</div>
	);
}
