import { IonModal } from "@ionic/react";
import { useEffect, useState } from "react";

import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { TextField } from "@/components/common/TextField";
import { type AuthUser, updateProfile } from "@/lib/api/auth";
import { setStoredUser } from "@/lib/auth/session";

interface AddressModalProps {
	isOpen: boolean;
	user: AuthUser;
	onClose: () => void;
	onSaved: (user: AuthUser) => void;
}

const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

/**
 * Address-only editor (P7) for the profile hero — opened from the location
 * pencil or the "Add address details" completion step. Kept separate from the
 * section-based EditProfileModal so the address lives in its own focused sheet.
 * Saves via `PATCH /app/auth/me` and pushes the fresh user back (the hero
 * repaints live via the reactive session store).
 */
export function AddressModal({
	isOpen,
	user,
	onClose,
	onSaved,
}: AddressModalProps) {
	const [address, setAddress] = useState("");
	const [locality, setLocality] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [pincode, setPincode] = useState("");
	const [latitude, setLatitude] = useState("");
	const [longitude, setLongitude] = useState("");
	const [saving, setSaving] = useState(false);

	// Re-seed from the current user every time the sheet opens.
	useEffect(() => {
		if (!isOpen) return;
		setAddress(user.address ?? "");
		setLocality(user.locality ?? "");
		setCity(user.city ?? "");
		setState(user.state ?? "");
		setPincode(user.pincode ?? "");
		setLatitude(user.latitude ?? "");
		setLongitude(user.longitude ?? "");
	}, [isOpen, user]);

	async function save() {
		if (saving) return;
		setSaving(true);
		try {
			const updated = await updateProfile({
				address: address.trim(),
				locality: locality.trim(),
				city: city.trim(),
				state: state.trim(),
				pincode: pincode.trim(),
				...(latitude ? { latitude } : {}),
				...(longitude ? { longitude } : {}),
			});
			setStoredUser(updated);
			onSaved(updated);
			onClose();
		} catch {
			// Failures are toasted centrally; keep the sheet open to retry.
		} finally {
			setSaving(false);
		}
	}

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			initialBreakpoint={1}
			breakpoints={[0, 1]}
		>
			<div className="flex h-full flex-col bg-surface-muted">
				<div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
					<button
						type="button"
						onClick={onClose}
						className="text-sm font-semibold text-muted"
					>
						Cancel
					</button>
					<h2 className="m-0 text-base font-extrabold text-ink">Address</h2>
					<button
						type="button"
						onClick={save}
						disabled={saving}
						className="text-sm font-bold text-primary disabled:opacity-50"
					>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-4 py-5">
					<div className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
						<div>
							<span className={LABEL}>Address</span>
							<AddressAutocomplete
								value={address}
								placeholder="Search your address"
								ariaLabel="Address"
								enableCurrentLocation
								onChange={setAddress}
								onSelect={(result) => {
									setAddress(result.full);
									if (result.locality) setLocality(result.locality);
									if (result.city) setCity(result.city);
									if (result.state) setState(result.state);
									if (result.pincode) setPincode(result.pincode);
									if (result.latitude) setLatitude(result.latitude);
									if (result.longitude) setLongitude(result.longitude);
								}}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<span className={LABEL}>Locality</span>
								<TextField
									value={locality}
									onChange={setLocality}
									placeholder="Locality"
								/>
							</div>
							<div>
								<span className={LABEL}>City</span>
								<TextField value={city} onChange={setCity} placeholder="City" />
							</div>
							<div>
								<span className={LABEL}>State</span>
								<TextField
									value={state}
									onChange={setState}
									placeholder="State"
								/>
							</div>
							<div>
								<span className={LABEL}>Pincode</span>
								<TextField
									value={pincode}
									onChange={(value) => setPincode(value.replace(/[^\d]/g, ""))}
									placeholder="Pincode"
									inputMode="numeric"
									autoCapitalize="none"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</IonModal>
	);
}
