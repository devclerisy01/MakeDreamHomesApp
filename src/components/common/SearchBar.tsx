import { IonIcon } from "@ionic/react";
import { useEffect, useRef, useState } from "react";

import { placeReverseGeocode } from "@/lib/api/places";
import { toastError } from "@/lib/api/toast";
import { getCurrentCoords } from "@/lib/native/geolocation";
import { ICONS } from "@/theme/icons";

interface SearchBarProps {
	placeholder?: string;
	defaultValue?: string;
	/** Debounced (400ms) callback with the trimmed term. */
	onSearch?: (term: string) => void;
	/** Show the "Near me" geolocate shortcut (listing pages). */
	showNearMe?: boolean;
}

/**
 * Search input with a leading glass icon, a custom clear (✕) button and an
 * optional "Near me" geolocate shortcut. Typing is debounced (400ms); clearing
 * and geolocating commit immediately. `maxLength` caps the term at 100 chars.
 */
export function SearchBar({
	placeholder = "Describe what you need",
	defaultValue = "",
	onSearch,
	showNearMe = false,
}: SearchBarProps) {
	const [value, setValue] = useState(defaultValue);
	const [locating, setLocating] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	/** Fire `onSearch` now, cancelling any pending debounce. */
	function commit(term: string) {
		if (timer.current) clearTimeout(timer.current);
		onSearch?.(term.trim());
	}

	function onChange(next: string) {
		setValue(next);
		if (!onSearch) return;
		if (timer.current) clearTimeout(timer.current);
		// Emptying the field resets results at once (matches the web clear).
		if (next === "") {
			onSearch("");
			return;
		}
		timer.current = setTimeout(() => onSearch(next.trim()), 400);
	}

	function clear() {
		setValue("");
		commit("");
		inputRef.current?.focus();
	}

	async function useCurrentLocation() {
		if (locating) return;
		setLocating(true);
		try {
			const coords = await getCurrentCoords();
			if (!coords.ok) {
				toastError(
					coords.reason === "denied"
						? "Location permission denied. Please enter it manually."
						: "Couldn't determine your location. Please try again.",
				);
				return;
			}
			const result = await placeReverseGeocode(
				String(coords.latitude),
				String(coords.longitude),
			);
			const term =
				[result?.locality, result?.city]
					.map((part) => part?.trim())
					.filter(Boolean)
					.join(", ") ||
				result?.full?.trim() ||
				"";
			if (term) {
				const trimmed = term.slice(0, 100);
				setValue(trimmed);
				commit(trimmed);
			} else {
				toastError("Couldn't determine your location. Please try again.");
			}
		} finally {
			setLocating(false);
		}
	}

	return (
		<form
			role="search"
			onSubmit={(event) => {
				event.preventDefault();
				commit(value);
			}}
			className="flex items-center gap-2.5 rounded-[14px] border border-line bg-white px-3.5 py-3 shadow-card-sm"
		>
			<IonIcon
				icon={ICONS.search}
				className="shrink-0 text-lg text-muted-light"
			/>
			<input
				ref={inputRef}
				className="min-w-0 flex-1 border-none bg-transparent font-sans text-sm text-ink outline-none placeholder:text-muted-light [&::-webkit-search-cancel-button]:appearance-none"
				type="search"
				value={value}
				maxLength={100}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
			/>
			{value ? (
				<button
					type="button"
					aria-label="Clear search"
					onClick={clear}
					className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-light transition-colors active:bg-surface-muted"
				>
					<IonIcon icon={ICONS.close} className="text-lg" />
				</button>
			) : null}
			{showNearMe ? (
				<button
					type="button"
					aria-label="Search near me"
					onClick={useCurrentLocation}
					disabled={locating}
					className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-muted text-muted-light transition-colors active:text-ink disabled:opacity-60"
				>
					{locating ? (
						<span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary" />
					) : (
						<IonIcon icon={ICONS.locate} className="text-lg" />
					)}
				</button>
			) : null}
		</form>
	);
}
