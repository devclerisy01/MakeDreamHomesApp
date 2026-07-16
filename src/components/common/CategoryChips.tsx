import type { ReactNode } from "react";

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
	/** Extra chip(s) rendered inline as the last item of the wrap row (e.g. "Other"). */
	trailing?: ReactNode;
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
	trailing,
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
							className={`rounded-full border px-[9px] py-1 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
								active
									? "border-primary bg-[#f5f7fb] text-primary"
									: "border-[#e2e4ef] bg-white text-[#6c6f7b]"
							}`}
						>
							{option.value}
						</button>
					);
				})}
				{trailing}
			</div>
			{error ? <p className="mt-1.5 text-[11px] text-danger">{error}</p> : null}
		</div>
	);
}
