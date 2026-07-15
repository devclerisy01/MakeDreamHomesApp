import { IonIcon } from "@ionic/react";
import { search as searchIcon } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
	placeholder?: string;
	defaultValue?: string;
	/** Debounced (400ms) callback with the trimmed term. */
	onSearch?: (term: string) => void;
}

/** "Describe what you need" search input with a leading search-glass icon. */
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
		<div className="flex items-center gap-2.5 rounded-[14px] border border-line bg-white px-3.5 py-3 shadow-card-sm">
			<IonIcon
				icon={searchIcon}
				className="shrink-0 text-lg text-muted-light"
			/>
			<input
				className="min-w-0 flex-1 border-none bg-transparent font-sans text-sm text-ink outline-none placeholder:text-muted-light"
				type="search"
				value={value}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	);
}
