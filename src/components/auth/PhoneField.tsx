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
				className={`flex items-center gap-2 rounded-2xl border bg-white p-2 shadow-card-sm ${
					error ? "border-danger" : "border-line"
				}`}
			>
				<span className="flex select-none items-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-[15px] font-bold text-ink">
					<span aria-hidden className="text-base leading-none">
						🇮🇳
					</span>
					+91
				</span>
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
					className="min-w-0 flex-1 border-none bg-transparent px-1 font-sans text-base text-ink outline-none placeholder:text-muted-light disabled:opacity-60"
				/>
			</div>
			{error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
		</div>
	);
}
