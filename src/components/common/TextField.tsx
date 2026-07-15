interface TextFieldProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	ariaLabel?: string;
	/** Render a multi-line textarea instead of a single-line input. */
	multiline?: boolean;
	rows?: number;
	autoCapitalize?: "none" | "words" | "sentences";
	disabled?: boolean;
	error?: string | null;
}

const FIELD =
	"w-full rounded-[9px] border bg-white px-3.5 py-3 font-sans text-[14px] text-ink outline-none transition-colors placeholder:font-medium placeholder:text-[#c4c7cc] focus:border-primary disabled:opacity-60";

/** Styled text input / textarea matching the auth form fields. */
export function TextField({
	value,
	onChange,
	placeholder,
	ariaLabel,
	multiline = false,
	rows = 4,
	autoCapitalize = "sentences",
	disabled,
	error,
}: TextFieldProps) {
	const border = error ? "border-danger" : "border-[#dae3ef]";
	return (
		<div>
			{multiline ? (
				<textarea
					className={`${FIELD} resize-none ${border}`}
					value={value}
					rows={rows}
					placeholder={placeholder}
					aria-label={ariaLabel ?? placeholder}
					autoCapitalize={autoCapitalize}
					disabled={disabled}
					onChange={(event) => onChange(event.target.value)}
				/>
			) : (
				<input
					type="text"
					className={`${FIELD} ${border}`}
					value={value}
					placeholder={placeholder}
					aria-label={ariaLabel ?? placeholder}
					autoCapitalize={autoCapitalize}
					disabled={disabled}
					onChange={(event) => onChange(event.target.value)}
				/>
			)}
			{error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
		</div>
	);
}
