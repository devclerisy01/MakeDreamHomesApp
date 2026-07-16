export const PHONE_DIGITS = 10;

interface PhoneFieldProps {
	value: string;
	onChange: (digits: string) => void;
	error?: string | null;
	autoFocus?: boolean;
	disabled?: boolean;
}

/**
 * Phone entry with a fixed `+91` chip — India-only, matching the design. Stores
 * and emits the bare 10 digits (what the API expects); the `+91` is display-only
 * and never sent.
 */
export function PhoneField({
	value,
	onChange,
	error,
	autoFocus,
	disabled,
}: PhoneFieldProps) {
	return (
		<div>
			<div
				className={`flex h-[49px] items-center gap-3 rounded-[9px] border bg-white pl-3.5 pr-3 ${
					error ? "border-danger" : "border-[#dae3ef]"
				}`}
			>
				<span className="flex select-none items-center gap-1.5 text-[13px] font-semibold text-ink">
					<span aria-hidden className="text-[15px] leading-none">
						🇮🇳
					</span>
					+91
				</span>
				<span aria-hidden className="h-[24px] w-px shrink-0 bg-[#dae3ef]" />
				<input
					id="login-phone"
					type="tel"
					inputMode="numeric"
					autoComplete="tel"
					autoFocus={autoFocus}
					disabled={disabled}
					value={value}
					placeholder="Phone number"
					onChange={(event) =>
						onChange(
							event.target.value.replace(/\D/g, "").slice(0, PHONE_DIGITS),
						)
					}
					className="min-w-0 flex-1 border-none bg-transparent font-sans text-[12px] text-ink outline-none placeholder:font-medium placeholder:text-[#c4c7cc] disabled:opacity-60"
				/>
			</div>
			{error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
		</div>
	);
}
