import { IonIcon, IonModal, IonSpinner, useIonToast } from "@ionic/react";
import { closeOutline, imageOutline } from "ionicons/icons";
import { type ChangeEvent, useEffect, useState } from "react";

import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { TextField } from "@/components/common/TextField";
import { createPortfolio, type PortfolioEntry } from "@/lib/api/portfolio";
import { uploadImageViaPresign } from "@/lib/api/uploads";

interface AddPortfolioModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSaved: (entry: PortfolioEntry) => void;
}

interface Photo {
	id: string;
	file: File;
	preview: string;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

let localSeq = 0;
const newLocalId = () => `local-${++localSeq}`;

/**
 * Add-project sheet for a signed-in professional — mirrors the web
 * `PortfolioModal`: a title, an address (Google autocomplete that fills the
 * locality/city/state/pincode fields) and one or more photos with a chosen
 * cover. Photos upload via the presigned flow; the entry is created PENDING and
 * handed back to the caller.
 */
export function AddPortfolioModal({
	isOpen,
	onClose,
	onSaved,
}: AddPortfolioModalProps) {
	const [present] = useIonToast();

	const [title, setTitle] = useState("");
	const [address, setAddress] = useState("");
	const [locality, setLocality] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [pincode, setPincode] = useState("");
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [coverId, setCoverId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// Reset the form each time the sheet opens.
	useEffect(() => {
		if (!isOpen) return;
		setTitle("");
		setAddress("");
		setLocality("");
		setCity("");
		setState("");
		setPincode("");
		setPhotos((prev) => {
			for (const p of prev) URL.revokeObjectURL(p.preview);
			return [];
		});
		setCoverId(null);
		setError(null);
	}, [isOpen]);

	// Revoke any remaining object URLs on unmount.
	useEffect(
		() => () => {
			setPhotos((prev) => {
				for (const p of prev) URL.revokeObjectURL(p.preview);
				return prev;
			});
		},
		[],
	);

	function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
		const picked = Array.from(event.target.files ?? []);
		event.target.value = "";
		setError(null);
		setPhotos((prev) => {
			const next = [...prev];
			for (const file of picked) {
				if (next.length >= MAX_FILES) {
					setError(`You can add up to ${MAX_FILES} images.`);
					break;
				}
				if (!file.type.startsWith("image/")) {
					setError("Only image files are allowed.");
					continue;
				}
				if (file.size > MAX_FILE_SIZE) {
					setError("Each image must be 5 MB or smaller.");
					continue;
				}
				next.push({
					id: newLocalId(),
					file,
					preview: URL.createObjectURL(file),
				});
			}
			// Default the cover to the first photo if none is chosen yet.
			setCoverId((c) => c ?? next[0]?.id ?? null);
			return next;
		});
	}

	function removePhoto(id: string) {
		setPhotos((prev) => {
			const target = prev.find((p) => p.id === id);
			if (target) URL.revokeObjectURL(target.preview);
			const next = prev.filter((p) => p.id !== id);
			setCoverId((c) => (c === id ? (next[0]?.id ?? null) : c));
			return next;
		});
	}

	async function save() {
		if (saving) return;
		if (!title.trim()) {
			setError("Please add a project name.");
			return;
		}
		if (photos.length === 0) {
			setError("Please add at least one photo.");
			return;
		}
		setSaving(true);
		try {
			// Upload every photo to storage via the presigned flow, in parallel.
			const keyById = new Map<string, string>();
			await Promise.all(
				photos.map(async (p) => {
					keyById.set(p.id, await uploadImageViaPresign(p.file, "portfolio"));
				}),
			);
			const keys = photos.map((p) => keyById.get(p.id) as string);
			const coverPhoto = coverId ? keyById.get(coverId) : undefined;

			const entry = await createPortfolio({
				title: title.trim(),
				address: address.trim() || undefined,
				locality: locality.trim() || undefined,
				city: city.trim() || undefined,
				state: state.trim() || undefined,
				pincode: pincode.trim() || undefined,
				photos: keys,
				coverPhoto,
			});
			onSaved(entry);
			void present({
				message: "Project added — it'll appear once approved.",
				duration: 1800,
				position: "top",
				color: "success",
			});
			onClose();
		} catch {
			void present({
				message: "Couldn't add the project. Please try again.",
				duration: 2000,
				position: "top",
				color: "danger",
			});
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
					<h2 className="m-0 text-base font-extrabold text-ink">Add Project</h2>
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
							<span className={LABEL}>Project name</span>
							<TextField
								value={title}
								onChange={(value) => {
									setTitle(value);
									if (error) setError(null);
								}}
								placeholder="e.g. Modern 3BHK Interior"
								autoCapitalize="words"
							/>
						</div>

						<div>
							<span className={LABEL}>Project address</span>
							<AddressAutocomplete
								value={address}
								placeholder="Search the project address"
								ariaLabel="Project address"
								onChange={setAddress}
								onSelect={(result) => {
									setAddress(result.full);
									if (result.locality) setLocality(result.locality);
									if (result.city) setCity(result.city);
									if (result.state) setState(result.state);
									if (result.pincode) setPincode(result.pincode);
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
							<span className={LABEL}>Photos</span>
							<p className="mb-2 text-xs text-muted-light">
								Tap a photo to set it as the cover. Up to {MAX_FILES} images, 5
								MB each.
							</p>
							<div className="flex flex-wrap gap-2.5">
								{photos.map((photo) => {
									const isCover = photo.id === coverId;
									return (
										<div key={photo.id} className="relative h-20 w-20">
											<button
												type="button"
												onClick={() => setCoverId(photo.id)}
												aria-label={isCover ? "Cover photo" : "Set as cover"}
												className={`block h-full w-full overflow-hidden rounded-lg border-2 ${
													isCover ? "border-primary" : "border-line"
												}`}
											>
												<img
													src={photo.preview}
													alt=""
													className="h-full w-full object-cover"
												/>
												{isCover ? (
													<span className="absolute inset-x-0 bottom-0 bg-primary py-0.5 text-center text-[10px] font-bold text-white">
														Cover
													</span>
												) : null}
											</button>
											<button
												type="button"
												onClick={() => removePhoto(photo.id)}
												aria-label="Remove photo"
												className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
											>
												<IonIcon icon={closeOutline} className="text-xs" />
											</button>
										</div>
									);
								})}
								{photos.length < MAX_FILES ? (
									<label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-muted-light">
										<IonIcon icon={imageOutline} className="text-2xl" />
										<span className="text-[10px] font-semibold">Add</span>
										<input
											type="file"
											accept="image/*"
											multiple
											className="hidden"
											onChange={onFilesChange}
										/>
									</label>
								) : null}
							</div>
						</div>

						{error ? <p className="text-sm text-danger">{error}</p> : null}

						<button
							type="button"
							onClick={save}
							disabled={saving}
							className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[15px] font-bold text-white active:opacity-90 disabled:opacity-60"
						>
							{saving ? (
								<IonSpinner name="crescent" className="h-5 w-5" />
							) : (
								"Add Project"
							)}
						</button>
					</div>
				</div>
			</div>
		</IonModal>
	);
}
