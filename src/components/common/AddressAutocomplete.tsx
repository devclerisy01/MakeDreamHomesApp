import { IonIcon, IonSpinner } from "@ionic/react";
import { locateOutline, locationOutline } from "ionicons/icons";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { UI_MESSAGES } from "@/constants/messages";
import {
	type AddressResult,
	placeAutocomplete,
	placeDetails,
	placeReverseGeocode,
	type PlacePrediction,
} from "@/lib/api/places";
import { getCurrentCoords } from "@/lib/native/geolocation";
import { toastInfo } from "@/lib/api/toast";

interface AddressAutocompleteProps {
	value: string;
	onChange: (value: string) => void;
	onSelect: (result: AddressResult) => void;
	placeholder?: string;
	ariaLabel?: string;
	error?: string | null;
	/** Show a button that fills the field from the device's current location. */
	enableCurrentLocation?: boolean;
}

const FIELD =
	"w-full rounded-xl border bg-white px-3.5 py-3 font-sans text-base text-ink outline-none transition-colors placeholder:text-muted-light focus:border-primary";

/** A v4 UUID when available, else a random hex string, else a timestamp — only
 *  groups Places billing sessions, so uniqueness isn't security-critical. */
function newSessionToken(): string {
	const c = globalThis.crypto;
	if (c?.randomUUID) return c.randomUUID();
	if (c?.getRandomValues) {
		return Array.from(c.getRandomValues(new Uint8Array(16)), (b) =>
			b.toString(16).padStart(2, "0"),
		).join("");
	}
	return `t${Date.now()}`;
}

/**
 * Free-text address input with Google Places (New) autocomplete via the backend
 * proxy (`/app/places/*`) — mirrors the web `AddressAutocomplete`. Typing fetches
 * predictions; picking one resolves it to a structured {@link AddressResult}
 * through `onSelect`. A per-session token groups the autocomplete + details call
 * for billing.
 */
export function AddressAutocomplete({
	value,
	onChange,
	onSelect,
	placeholder = "Search your address",
	ariaLabel,
	error,
	enableCurrentLocation = false,
}: AddressAutocompleteProps) {
	const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
	const [loading, setLoading] = useState(false);
	const [locating, setLocating] = useState(false);
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Monotonic request id — only the latest in-flight request may update state.
	const requestIdRef = useRef(0);
	const sessionTokenRef = useRef<string>(newSessionToken());

	// Close the dropdown when tapping outside the field.
	useEffect(() => {
		function onPointerDown(event: MouseEvent | TouchEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("touchstart", onPointerDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("touchstart", onPointerDown);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	function fetchSuggestions(query: string) {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		if (!query || query.trim().length < 3) {
			setSuggestions([]);
			setOpen(false);
			setLoading(false);
			return;
		}
		timeoutRef.current = setTimeout(async () => {
			const reqId = ++requestIdRef.current;
			setLoading(true);
			setOpen(true);
			const results = await placeAutocomplete(query, sessionTokenRef.current);
			if (reqId !== requestIdRef.current) return; // superseded
			setSuggestions(results);
			setLoading(false);
		}, 400);
	}

	function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
		const next = event.target.value;
		onChange(next);
		fetchSuggestions(next);
	}

	async function handleSuggestionClick(prediction: PlacePrediction) {
		setOpen(false);
		setLoading(true);
		const result = await placeDetails(
			prediction.placeId,
			sessionTokenRef.current,
		);
		setLoading(false);
		// Session consumed — start a fresh one for the next lookup.
		sessionTokenRef.current = newSessionToken();
		if (result) onSelect(result);
	}

	async function handleUseCurrentLocation() {
		if (locating) return;
		setOpen(false);
		setLocating(true);
		// Requests the OS location permission on native, then reads the position.
		const coords = await getCurrentCoords();
		if (!coords.ok) {
			setLocating(false);
			toastInfo(
				coords.reason === "denied"
					? UI_MESSAGES.locationDenied
					: UI_MESSAGES.locationUnavailable,
			);
			return;
		}
		try {
			const result = await placeReverseGeocode(
				String(coords.latitude),
				String(coords.longitude),
			);
			if (result) {
				onChange(result.full);
				onSelect(result);
			} else {
				toastInfo(UI_MESSAGES.locationFailed);
			}
		} finally {
			setLocating(false);
		}
	}

	const border = error ? "border-danger" : "border-line";

	return (
		<div ref={containerRef} className="relative w-full">
			<div className="relative">
				<input
					type="text"
					value={value}
					placeholder={placeholder}
					aria-label={ariaLabel ?? placeholder}
					autoCapitalize="words"
					className={`${FIELD} ${border} ${enableCurrentLocation ? "pr-11" : ""}`}
					onChange={handleInputChange}
					onFocus={() => {
						if (suggestions.length > 0) setOpen(true);
					}}
				/>
				{loading ? (
					<span
						className={`pointer-events-none absolute top-0 flex h-full items-center text-muted-light ${
							enableCurrentLocation ? "right-11" : "right-3"
						}`}
					>
						<IonSpinner name="crescent" className="h-4 w-4" />
					</span>
				) : null}
				{enableCurrentLocation ? (
					<button
						type="button"
						onClick={handleUseCurrentLocation}
						disabled={locating}
						aria-label="Use my current location"
						className="absolute right-1 top-0 grid h-full w-9 place-items-center text-muted-light active:text-primary disabled:opacity-60"
					>
						{locating ? (
							<IonSpinner name="crescent" className="h-4 w-4" />
						) : (
							<IonIcon icon={locateOutline} className="text-lg" />
						)}
					</button>
				) : null}
			</div>

			{error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}

			{open && suggestions.length > 0 ? (
				<div className="absolute inset-x-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-lg">
					<ul className="m-0 list-none p-0">
						{suggestions.map((s) => (
							<li key={s.placeId}>
								<button
									type="button"
									onClick={() => handleSuggestionClick(s)}
									className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left active:bg-surface-muted"
								>
									<IonIcon
										icon={locationOutline}
										className="mt-0.5 shrink-0 text-lg text-muted-light"
									/>
									<span className="flex flex-col">
										<span className="text-sm font-semibold text-ink">
											{s.primaryText || s.fullText}
										</span>
										{s.secondaryText ? (
											<span className="line-clamp-1 text-xs text-muted-light">
												{s.secondaryText}
											</span>
										) : null}
									</span>
								</button>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}
