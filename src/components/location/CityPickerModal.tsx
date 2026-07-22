import { IonIcon, IonModal } from "@ionic/react";
import { useEffect, useRef, useState } from "react";

import { UI_MESSAGES } from "@/constants/messages";
import {
	type CityOption,
	citySearch,
	persistSearchedCity,
} from "@/lib/api/locations";
import { placeDetails, type PlacePrediction } from "@/lib/api/places";
import { CITY_RADIUS_KM, nearestCity } from "@/lib/geo/geo";
import {
	locationFromCity,
	type SelectedLocation,
} from "@/lib/geo/location-store";
import { getCurrentCoords } from "@/lib/native/geolocation";
import { toastInfo } from "@/lib/api/toast";
import { ICONS } from "@/theme/icons";

interface CityPickerModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** Verified cities (for the nearby list + current-location matching). */
	cities: CityOption[];
	/** The currently-selected city name (for the check mark + ranking centre). */
	value?: string;
	onSelect: (loc: SelectedLocation) => void;
}

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
 * Header city picker (bottom sheet): a search box (our table first, Google
 * Places fallback), a nearby list of verified cities, and "use current
 * location". Mirrors the web's `CitySelect`, adapted to a mobile sheet.
 */
export function CityPickerModal({
	isOpen,
	onClose,
	cities,
	value,
	onSelect,
}: CityPickerModalProps) {
	const [query, setQuery] = useState("");
	const [dbMatches, setDbMatches] = useState<CityOption[]>([]);
	const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
	const [locating, setLocating] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestIdRef = useRef(0);
	const sessionTokenRef = useRef<string>(newSessionToken());

	// Reset the transient search state each time the sheet opens.
	useEffect(() => {
		if (isOpen) {
			setQuery("");
			setDbMatches([]);
			setSuggestions([]);
		}
	}, [isOpen]);

	// Debounced city search (≥ 2 chars); only the latest response wins.
	useEffect(() => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		const q = query.trim();
		if (q.length < 2) {
			setDbMatches([]);
			setSuggestions([]);
			return;
		}
		timeoutRef.current = setTimeout(() => {
			const reqId = ++requestIdRef.current;
			void citySearch(q, sessionTokenRef.current).then((res) => {
				if (reqId !== requestIdRef.current) return;
				setDbMatches(res.cities);
				setSuggestions(res.cities.length ? [] : res.suggestions);
			});
		}, 300);
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [query]);

	function pickCity(city: CityOption) {
		const loc = locationFromCity(city);
		if (loc) {
			onSelect(loc);
			onClose();
		}
	}

	async function pickPrediction(p: PlacePrediction) {
		const token = sessionTokenRef.current;
		sessionTokenRef.current = newSessionToken();
		const details = await placeDetails(p.placeId, token);
		if (!details) {
			toastInfo(UI_MESSAGES.locationFailed);
			return;
		}
		// Record the searched city (unapproved) so admins can verify it later.
		void persistSearchedCity({
			city: details.city || p.primaryText,
			state: details.state,
			pincode: details.pincode,
			country: details.country,
			latitude: details.latitude,
			longitude: details.longitude,
		});
		const lat = Number(details.latitude);
		const lng = Number(details.longitude);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			toastInfo(UI_MESSAGES.locationFailed);
			return;
		}
		onSelect({
			city: details.city || p.primaryText,
			state: details.state || null,
			lat,
			lng,
			radius: CITY_RADIUS_KM,
		});
		onClose();
	}

	async function useCurrentLocation() {
		if (locating) return;
		setLocating(true);
		// Requests the OS location permission on native, then reads the position.
		const result = await getCurrentCoords();
		setLocating(false);
		if (!result.ok) {
			toastInfo(
				result.reason === "denied"
					? UI_MESSAGES.locationDenied
					: UI_MESSAGES.locationUnavailable,
			);
			return;
		}
		const near = nearestCity(cities, result.latitude, result.longitude);
		if (near) pickCity(near);
		else toastInfo(UI_MESSAGES.locationFailed);
	}

	const searching = query.trim().length >= 2;

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			initialBreakpoint={1}
			breakpoints={[0, 1]}
		>
			<div className="flex h-full flex-col bg-white">
				<div className="flex items-center justify-between border-b border-line px-4 py-3">
					<h2 className="m-0 text-base font-extrabold text-ink">
						Choose your city
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="grid h-8 w-8 place-items-center rounded-full text-muted-light active:bg-surface-muted"
					>
						<IonIcon icon={ICONS.close} className="text-xl" />
					</button>
				</div>

				<div className="px-4 py-3">
					<div className="flex items-center gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2.5">
						<IonIcon icon={ICONS.search} className="text-lg text-muted-light" />
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search for a city"
							className="w-full bg-transparent font-sans text-base text-ink outline-none placeholder:text-muted-light"
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-2 pb-6">
					<button
						type="button"
						onClick={useCurrentLocation}
						className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left active:bg-surface-muted"
					>
						<IonIcon icon={ICONS.locate} className="text-xl text-primary" />
						<span className="text-sm font-semibold text-primary">
							{locating ? "Detecting location…" : "Use my current location"}
						</span>
					</button>

					{searching ? (
						<>
							{dbMatches.map((c) => (
								<CityRow
									key={c.id}
									label={c.city}
									sub={c.state}
									active={c.city === value}
									onClick={() => pickCity(c)}
								/>
							))}
							{!dbMatches.length && suggestions.length ? (
								<>
									<p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-light">
										More cities
									</p>
									{suggestions.map((p) => (
										<CityRow
											key={p.placeId}
											label={p.primaryText}
											sub={p.secondaryText}
											onClick={() => void pickPrediction(p)}
										/>
									))}
								</>
							) : null}
							{!dbMatches.length && !suggestions.length ? (
								<p className="px-3 py-6 text-center text-sm text-muted-light">
									No cities found.
								</p>
							) : null}
						</>
					) : null}
				</div>
			</div>
		</IonModal>
	);
}

function CityRow({
	label,
	sub,
	active = false,
	onClick,
}: {
	label: string;
	sub?: string | null;
	active?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-surface-muted"
		>
			<IonIcon
				icon={ICONS.location}
				className="shrink-0 text-lg text-muted-light"
			/>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-sm font-semibold text-ink">
					{label}
				</span>
				{sub ? (
					<span className="block truncate text-xs text-muted-light">{sub}</span>
				) : null}
			</span>
			{active ? (
				<IonIcon icon={ICONS.check} className="shrink-0 text-lg text-primary" />
			) : null}
		</button>
	);
}
