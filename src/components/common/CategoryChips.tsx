import type { CategoryOption } from "@/lib/api/misc";

interface CategoryChipsProps {
	options: CategoryOption[];
	/** Currently-selected option ids. */
	selected: number[];
	/** Single-select (radio-like) vs multi-select. */
	single?: boolean;
	onChange: (ids: number[]) => void;
	error?: string | null;
	disabled?: boolean;
}

/**
 * Selectable pill chips for the signup category pickers — single-select for a
 * professional's trade, multi-select for a supplier's products. Selected chips
 * fill with the brand color. Mirrors the web register form's `CategoryChips`.
 */
export function CategoryChips({
	options,
	selected,
	single = false,
	onChange,
	error,
	disabled,
}: CategoryChipsProps) {
	function toggle(id: number) {
		if (single) {
			onChange(selected.includes(id) ? [] : [id]);
			return;
		}
		onChange(
			selected.includes(id)
				? selected.filter((value) => value !== id)
				: [...selected, id],
		);
	}

	return (
		<div>
			<div className="flex flex-wrap gap-2">
				{options.map((option) => {
					const active = selected.includes(option.id);
					return (
						<button
							key={option.id}
							type="button"
							aria-pressed={active}
							disabled={disabled}
							onClick={() => toggle(option.id)}
							className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
								active
									? "border-primary bg-primary text-white"
									: "border-line bg-white text-muted"
							}`}
						>
							{option.value}
						</button>
					);
				})}
			</div>
			{error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
		</div>
	);
}
