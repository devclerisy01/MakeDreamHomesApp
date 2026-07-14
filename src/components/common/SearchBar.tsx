import { IonIcon } from "@ionic/react";
import { informationCircleOutline, sparkles } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
	placeholder?: string;
	defaultValue?: string;
	/** Debounced (400ms) callback with the trimmed term. */
	onSearch?: (term: string) => void;
}

/**
 * "Describe what you need" search input with a trailing sparkle button. The
 * sparkle is visual-only in Phase 1 (reserved for future AI search); typing
 * fires the debounced text search.
 */
export function SearchBar({
	placeholder = "Describe what you need",
	defaultValue = "",
	onSearch,
}: SearchBarProps) {
	const [value, setValue] = useState(defaultValue);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	const onChange = (next: string) => {
		setValue(next);
		if (!onSearch) return;
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => onSearch(next.trim()), 400);
	};

	return (
		<div className="flex items-center gap-2 rounded-[14px] border border-line bg-white py-1.5 pl-3 pr-1.5 shadow-card-sm">
			<IonIcon
				icon={informationCircleOutline}
				className="shrink-0 text-xl text-muted-light"
			/>
			<input
				className="min-w-0 flex-1 border-none bg-transparent font-sans text-sm text-ink outline-none placeholder:text-muted-light"
				type="text"
				value={value}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
			/>
			<button
				type="button"
				className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-ink text-white"
				aria-label="AI search"
			>
				<IonIcon icon={sparkles} className="text-[18px]" />
			</button>
		</div>
	);
}
