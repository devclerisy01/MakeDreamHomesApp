import { IonIcon, IonModal, IonSpinner, IonSelect, IonSelectOption } from "@ionic/react";
import { cameraOutline } from "ionicons/icons";
import { type ChangeEvent, useEffect, useState } from "react";

import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { CategoryChips } from "@/components/common/CategoryChips";
import { TextField } from "@/components/common/TextField";
import { Avatar } from "@/components/common/Avatar";
import { UI_MESSAGES } from "@/constants/messages";
import {
	type AuthUser,
	updateProfile,
	uploadProfileImage,
} from "@/lib/api/auth";
import {
	type CategoryOption,
	getMaterialCategories,
	getProfessionalCategories,
} from "@/lib/api/misc";
import { toastError, toastInfo } from "@/lib/api/toast";
import { setStoredUser } from "@/lib/auth/session";

const GENDERS = [
	{ value: "", label: "Not set" },
	{ value: "male", label: "Male" },
	{ value: "female", label: "Female" },
	{ value: "other", label: "Other" },
];

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

interface EditProfileModalProps {
	user: AuthUser;
	isOpen: boolean;
	onClose: () => void;
	onSaved: (user: AuthUser) => void;
}

/**
 * Edit-profile sheet: photo upload + the fields the signed-in user can change,
 * varying by userType (business name/GSTIN for businesses, a single profession
 * for professionals, product categories for suppliers). Saves via
 * `PATCH /app/auth/me` and hands the fresh user back to the caller.
 */
export function EditProfileModal({
	user,
	isOpen,
	onClose,
	onSaved,
}: EditProfileModalProps) {
	const isBusiness = user.userType !== "person";
	const isProfessional = user.userType === "professional";
	const isSupplier = user.userType === "supplier";
	const isDealer = user.userType === "dealer";

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [gender, setGender] = useState("");
	const [businessName, setBusinessName] = useState("");
	const [businessGstin, setBusinessGstin] = useState("");
	const [isReraCertified, setIsReraCertified] = useState(false);
	const [reraNumber, setReraNumber] = useState("");
	const [experience, setExperience] = useState("");
	const [address, setAddress] = useState("");
	const [locality, setLocality] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [pincode, setPincode] = useState("");
	const [latitude, setLatitude] = useState("");
	const [longitude, setLongitude] = useState("");
	const [about, setAbout] = useState("");
	// `photoPreview` is what the avatar shows (existing URL or a local object-URL
	// of a freshly picked file); `photoKey` is the uploaded bucket key to persist,
	// set only when a new photo was uploaded this session.
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [photoKey, setPhotoKey] = useState<string | null>(null);
	const [proCatId, setProCatId] = useState<number | null>(null);
	const [productIds, setProductIds] = useState<number[]>([]);

	const [proOptions, setProOptions] = useState<CategoryOption[]>([]);
	const [materialOptions, setMaterialOptions] = useState<CategoryOption[]>([]);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);

	// Seed the form from the current user each time the sheet opens.
	useEffect(() => {
		if (!isOpen) return;
		setFirstName(user.firstName ?? "");
		setLastName(user.lastName ?? "");
		setGender(user.gender ?? "");
		setBusinessName(user.businessName ?? "");
		setBusinessGstin(user.businessGstin ?? "");
		setIsReraCertified(user.isReraCertified ?? false);
		setReraNumber(user.reraNumber ?? "");
		setExperience(user.experience ?? "");
		setAddress(user.address ?? "");
		setLocality(user.locality ?? "");
		setCity(user.city ?? "");
		setState(user.state ?? "");
		setPincode(user.pincode ?? "");
		setLatitude(user.latitude ?? "");
		setLongitude(user.longitude ?? "");
		setAbout(user.about ?? "");
		setPhotoPreview(user.profilePhoto ?? null);
		setPhotoKey(null);
		setProCatId(
			user.professionalUserType ? Number(user.professionalUserType) : null,
		);
		setProductIds(user.supplierProductIds ?? []);
	}, [isOpen, user]);

	// Revoke a superseded local preview (on replacement, reseed, or unmount) so
	// object URLs don't leak.
	useEffect(() => {
		return () => {
			if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
		};
	}, [photoPreview]);

	useEffect(() => {
		if (!isOpen) return;
		const controller = new AbortController();
		if (isProfessional) {
			getProfessionalCategories(controller.signal)
				.then(setProOptions)
				.catch(() => {});
		}
		if (isSupplier) {
			getMaterialCategories(controller.signal)
				.then(setMaterialOptions)
				.catch(() => {});
		}
		return () => controller.abort();
	}, [isOpen, isProfessional, isSupplier]);

	async function onPhotoPick(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toastInfo(UI_MESSAGES.imageOnly);
			return;
		}
		if (file.size > MAX_PHOTO_SIZE) {
			toastInfo(UI_MESSAGES.imageTooLarge);
			return;
		}
		// Show the picked file immediately via a local object URL while the
		// presigned upload runs (the effect below revokes superseded previews).
		const objectUrl = URL.createObjectURL(file);
		setPhotoPreview(objectUrl);
		setUploading(true);
		try {
			// Presigned upload returns the bucket KEY to persist on save.
			setPhotoKey(await uploadProfileImage(file));
		} catch {
			setPhotoPreview(user.profilePhoto ?? null);
			setPhotoKey(null);
			toastError(UI_MESSAGES.photoUploadFailed);
		} finally {
			setUploading(false);
		}
	}

	async function save() {
		if (saving) return;
		// A RERA-certified dealer must supply their RERA number (mirrors the web).
		if (isDealer && isReraCertified && !reraNumber.trim()) {
			toastError(UI_MESSAGES.reraRequired);
			return;
		}
		// A supplier must keep at least one product category (mirrors the web).
		if (isSupplier && productIds.length === 0) {
			toastError(UI_MESSAGES.productRequired);
			return;
		}
		setSaving(true);
		try {
			const updated = await updateProfile({
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				gender,
				address: address.trim(),
				locality: locality.trim(),
				city: city.trim(),
				state: state.trim(),
				pincode: pincode.trim(),
				about: about.trim(),
				...(latitude ? { latitude } : {}),
				...(longitude ? { longitude } : {}),
				// Only persist the photo when a new one was uploaded this session —
				// `profilePhoto` on the user is a temporary presigned URL, not a key.
				...(photoKey ? { profilePhoto: photoKey } : {}),
				...(isBusiness
					? {
							businessName: businessName.trim(),
							// Always send GSTIN (empty string clears it).
							businessGstin: businessGstin.trim(),
						}
					: {}),
				...(isDealer
					? {
							isReraCertified,
							// Clear the number when un-certified (mirrors the web).
							reraNumber: isReraCertified ? reraNumber.trim() : "",
						}
					: {}),
				...(isProfessional
					? {
							experience: experience.trim(),
							...(proCatId ? { professionalCategoryId: proCatId } : {}),
						}
					: {}),
				...(isSupplier ? { supplierProductIds: productIds } : {}),
			});
			setStoredUser(updated);
			onSaved(updated);
			// Success is toasted centrally (profile.updated).
			onClose();
		} catch {
			// Save failures are toasted centrally; keep the sheet open to retry.
		} finally {
			setSaving(false);
		}
	}

	return (
		<IonModal isOpen={isOpen} onDidDismiss={onClose}>
			<div className="flex h-full flex-col bg-surface-muted">
				<div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
					<button
						type="button"
						onClick={onClose}
						className="text-sm font-semibold text-muted"
					>
						Cancel
					</button>
					<h2 className="m-0 text-base font-extrabold text-ink">
						Edit Profile
					</h2>
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
						<div className="flex flex-col items-center gap-2">
							<div className="relative">
								<Avatar
									name={firstName || businessName || "You"}
									image={photoPreview ?? undefined}
									size={88}
									className="rounded-2xl"
								/>
								<label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white bg-primary text-white">
									{uploading ? (
										<IonSpinner name="crescent" className="h-4 w-4" />
									) : (
										<IonIcon icon={cameraOutline} className="text-base" />
									)}
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={onPhotoPick}
									/>
								</label>
							</div>
							<span className="text-xs text-muted-light">
								Tap the camera to change your photo
							</span>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<span className={LABEL}>First name</span>
								<TextField
									value={firstName}
									onChange={setFirstName}
									placeholder="First name"
									autoCapitalize="words"
								/>
							</div>
							<div>
								<span className={LABEL}>Last name</span>
								<TextField
									value={lastName}
									onChange={setLastName}
									placeholder="Last name"
									autoCapitalize="words"
								/>
							</div>
						</div>

						<div>
							<span className={LABEL}>Gender</span>
							<IonSelect
								value={gender}
								mode="ios"
								interface="action-sheet"
								interfaceOptions={{
									header: "Gender",
									cssClass: "mdh-lang-sheet",
									mode: "ios",
								}}
								onIonChange={(event) => setGender(event.detail.value)}
								className="mdh-select w-full"
							>
								{GENDERS.map((option) => (
									<IonSelectOption key={option.value} value={option.value}>
										{option.label}
									</IonSelectOption>
								))}
							</IonSelect>
						</div>

						{isBusiness ? (
							<>
								<div>
									<span className={LABEL}>Business name</span>
									<TextField
										value={businessName}
										onChange={setBusinessName}
										placeholder="Business name"
										autoCapitalize="words"
									/>
								</div>
								<div>
									<span className={LABEL}>GSTIN</span>
									<TextField
										value={businessGstin}
										onChange={setBusinessGstin}
										placeholder="GST number (optional)"
										autoCapitalize="none"
									/>
								</div>
							</>
						) : null}

						{isDealer ? (
							<div>
								<label className="flex items-center gap-2.5">
									<input
										type="checkbox"
										checked={isReraCertified}
										onChange={(event) =>
											setIsReraCertified(event.target.checked)
										}
										className="h-4 w-4 accent-primary"
									/>
									<span className="text-sm font-semibold text-ink">
										RERA certified
									</span>
								</label>
								{isReraCertified ? (
									<div className="mt-2">
										<span className={LABEL}>RERA number</span>
										<TextField
											value={reraNumber}
											onChange={setReraNumber}
											placeholder="RERA registration number"
											autoCapitalize="none"
										/>
									</div>
								) : null}
							</div>
						) : null}

						{isProfessional ? (
							<>
								<div>
									<span className={LABEL}>Type of Professional</span>
									<CategoryChips
										options={proOptions}
										selected={proCatId !== null ? [proCatId] : []}
										single
										onChange={(ids) => setProCatId(ids[0] ?? null)}
									/>
								</div>
								<div>
									<span className={LABEL}>Experience (years)</span>
									<TextField
										value={experience}
										onChange={(value) =>
											setExperience(value.replace(/[^\d.]/g, ""))
										}
										placeholder="e.g. 5"
										autoCapitalize="none"
									/>
								</div>
							</>
						) : null}

						{isSupplier ? (
							<div>
								<span className={LABEL}>Product Categories</span>
								<CategoryChips
									options={materialOptions}
									selected={productIds}
									onChange={setProductIds}
								/>
							</div>
						) : null}

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
									autoCapitalize="none"
								/>
							</div>
						</div>

						<div>
							<span className={LABEL}>About</span>
							<TextField
								value={about}
								onChange={setAbout}
								placeholder="Tell people about yourself or your business"
								multiline
								rows={4}
							/>
						</div>
					</div>
				</div>
			</div>
		</IonModal>
	);
}
