import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useState } from "react";

import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import type { AddressResult } from "@/lib/api/places";
import { toastInfo } from "@/lib/api/toast";
import { distanceKm } from "@/lib/geo/geo";

/** Preferred localities must sit within this radius of the first pick. */
const MAX_DISTANCE_KM = 50;

interface LocalityPickerProps {
	/** Committed, resolved localities (each a real Places pick). */
	value: AddressResult[];
	onChange: (next: AddressResult[]) => void;
	/** 1 = single locality shown in the field; >1 = chips + add-input (buy-property). */
	max: number;
	error?: string | null;
	onErrorClear?: () => void;
	id?: string;
	placeholder?: string;
}

/**
 * Location picker for Post Requirement. **Single mode** (`max === 1`) keeps one
 * resolved Places pick in the field. **Multi mode** (`max > 1`, buy-property)
 * collects up to `max` locality chips, each a resolved pick within 50 km of the
 * first — predictions for the 2nd+ are region-only and hard-restricted to that
 * circle. Only resolved selections commit; hand-typed text never becomes a value
 * (so a location is always backed by real coordinates).
 */
export function LocalityPicker({
	value,
	onChange,
	max,
	error,
	onErrorClear,
	id,
	placeholder = "Search your address",
}: LocalityPickerProps) {
	const [draft, setDraft] = useState("");
	const multi = max > 1;
	const anchor = value[0] ?? null;
	const full = value.length >= max;

	function commit(res: AddressResult) {
		if (multi) {
			if (value.length >= max) return;
			// 50 km proximity guard from the first pick (covers the current-location
			// button too, which skips the dropdown's restricted search).
			if (
				anchor &&
				distanceKm(
					Number(anchor.latitude),
					Number(anchor.longitude),
					Number(res.latitude),
					Number(res.longitude),
				) > MAX_DISTANCE_KM
			) {
				toastInfo(
					`Preferred localities must be within ${MAX_DISTANCE_KM} km of the first one.`,
				);
				return;
			}
			// Dedupe by resolved full text.
			if (value.some((v) => v.full === res.full)) {
				setDraft("");
				return;
			}
			onChange([...value, res]);
			setDraft("");
		} else {
			onChange([res]);
			setDraft(res.full);
		}
		onErrorClear?.();
	}

	function removeAt(index: number) {
		onChange(value.filter((_, i) => i !== index));
	}

	return (
		<div id={id}>
			{multi ? (
				<>
					{value.length ? (
						<div className="mb-2 flex flex-wrap gap-2">
							{value.map((loc, i) => (
								<span
									key={loc.full}
									className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface-muted py-1 pl-3 pr-1.5 text-[12px] font-medium text-ink"
								>
									<span className="truncate">
										{loc.locality || loc.city || loc.full}
									</span>
									<button
										type="button"
										onClick={() => removeAt(i)}
										aria-label="Remove locality"
										className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-black/10 text-ink active:bg-black/20"
									>
										<IonIcon icon={closeOutline} className="text-[11px]" />
									</button>
								</span>
							))}
						</div>
					) : null}
					{full ? (
						<p className="m-0 text-[11px] text-muted-light">
							You can add up to {max} localities.
						</p>
					) : (
						<AddressAutocomplete
							value={draft}
							onChange={(v) => {
								setDraft(v);
								if (v.trim()) onErrorClear?.();
							}}
							onSelect={commit}
							placeholder={value.length ? "Add another locality" : placeholder}
							ariaLabel="Address"
							enableCurrentLocation
							regionsOnly
							biasLocation={
								anchor
									? { latitude: anchor.latitude, longitude: anchor.longitude }
									: null
							}
							restrictToBias={Boolean(anchor)}
							error={error}
						/>
					)}
				</>
			) : (
				<AddressAutocomplete
					value={value[0]?.full ?? draft}
					onChange={(v) => {
						setDraft(v);
						// Typing invalidates a resolved pick — a new suggestion must be
						// chosen (keeps the location backed by real coordinates).
						if (value.length) onChange([]);
						if (v.trim()) onErrorClear?.();
					}}
					onSelect={commit}
					placeholder={placeholder}
					ariaLabel="Address"
					enableCurrentLocation
					regionsOnly
					error={error}
				/>
			)}
		</div>
	);
}
