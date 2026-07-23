import { IonIcon, IonModal, IonSpinner } from "@ionic/react";
import { closeOutline, imageOutline } from "ionicons/icons";
import { type ChangeEvent, useEffect, useState } from "react";

import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { TextField } from "@/components/common/TextField";
import { UI_MESSAGES } from "@/constants/messages";
import {
	createPortfolio,
	type PortfolioEntry,
	updatePortfolio,
} from "@/lib/api/portfolio";
import { toastError } from "@/lib/api/toast";
import { uploadImageViaPresign } from "@/lib/api/uploads";

interface AddPortfolioModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSaved: (entry: PortfolioEntry) => void;
	/** When set, the sheet edits this entry instead of creating a new one. */
	entry?: PortfolioEntry | null;
}

/**
 * A photo in the picker: an existing media row (edit mode) or a newly-picked
 * local file. Both carry a stable `id` used for cover selection + removal.
 */
type Photo =
	| { kind: "existing"; id: string; url: string }
	| { kind: "new"; id: string; file: File; preview: string };

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

let localSeq = 0;
const newLocalId = () => `local-${++localSeq}`;

/**
 * Add / edit-project sheet for a signed-in professional — mirrors the web
 * `PortfolioModal`: a title, category, description, an address (Google
 * autocomplete that fills locality/city/state/pincode) and one or more photos
 * with a chosen cover. In edit mode it also removes existing photos and appends
 * new ones. Photos upload via the presigned flow; create/edit re-enter PENDING.
 */
export function AddPortfolioModal({
	isOpen,
	onClose,
	onSaved,
	entry = null,
}: AddPortfolioModalProps) {
	const isEdit = Boolean(entry);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("");
	const [address, setAddress] = useState("");
	const [locality, setLocality] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [pincode, setPincode] = useState("");
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [coverId, setCoverId] = useState<string | null>(null);
	/** Existing media ids the user removed (sent to the API on save). */
	const [deletedIds, setDeletedIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// Seed the form each time the sheet opens — from the edited entry, or blank.
	useEffect(() => {
		if (!isOpen) return;
		setTitle(entry?.title ?? "");
		setDescription(entry?.description ?? "");
		setCategory(entry?.category ?? "");
		setAddress(entry?.address ?? "");
		setLocality(entry?.locality ?? "");
		setCity(entry?.city ?? "");
		setState(entry?.state ?? "");
		setPincode(entry?.pincode ?? "");
		setDeletedIds([]);
		setError(null);
		setPhotos((prev) => {
			for (const p of prev)
				if (p.kind === "new") URL.revokeObjectURL(p.preview);
			return (entry?.media ?? []).map((m) => ({
				kind: "existing" as const,
				id: m.id,
				url: m.url,
			}));
		});
		const cover = entry?.media.find((m) => m.isCover) ?? entry?.media[0];
		setCoverId(cover?.id ?? null);
	}, [isOpen, entry]);

	// Revoke any remaining local object URLs on unmount.
	useEffect(
		() => () => {
			setPhotos((prev) => {
				for (const p of prev)
					if (p.kind === "new") URL.revokeObjectURL(p.preview);
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
					kind: "new",
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
			if (target?.kind === "new") URL.revokeObjectURL(target.preview);
			if (target?.kind === "existing") setDeletedIds((d) => [...d, id]);
			const next = prev.filter((p) => p.id !== id);
			setCoverId((c) => (c === id ? (next[0]?.id ?? null) : c));
			return next;
		});
	}

	async function save() {
		if (saving) return;
		if (!title.trim()) {
			setError("Add a portfolio name.");
			return;
		}
		if (photos.length === 0) {
			setError("Please add at least one photo.");
			return;
		}
		setSaving(true);
		try {
			// Upload only the newly-picked photos (existing ones already have keys).
			// The S3 PUT isn't routed through the API client (so not auto-toasted);
			// surface an upload failure here and stop.
			const newPhotos = photos.filter((p) => p.kind === "new");
			const keyById = new Map<string, string>();
			try {
				await Promise.all(
					newPhotos.map(async (p) => {
						keyById.set(p.id, await uploadImageViaPresign(p.file, "portfolio"));
					}),
				);
			} catch {
				toastError(UI_MESSAGES.photosUploadFailed);
				return;
			}

			// The cover is either an existing media id or one of the new keys.
			const coverIsNew = newPhotos.some((p) => p.id === coverId);
			const coverPhoto =
				coverId && coverIsNew ? keyById.get(coverId) : undefined;
			const coverImageId = coverId && !coverIsNew ? coverId : undefined;
			const newKeys = newPhotos.map((p) => keyById.get(p.id) as string);

			const common = {
				title: title.trim(),
				description: description.trim(),
				category: category.trim(),
				address: address.trim(),
				locality: locality.trim(),
				city: city.trim(),
				state: state.trim(),
				pincode: pincode.trim(),
			};

			const result =
				isEdit && entry
					? await updatePortfolio(entry.id, {
							...common,
							photos: newKeys,
							deletedImageIds: deletedIds,
							coverImageId,
							coverPhoto,
						})
					: await createPortfolio({
							...common,
							photos: newKeys,
							coverPhoto,
						});
			// Success is toasted centrally (portfolio.created / .updated).
			onSaved(result);
			onClose();
		} catch {
			// Failures are toasted centrally; keep the sheet open to retry.
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
						{isEdit ? "Edit Portfolio Item" : "Add Portfolio"}
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
						<div>
							<span className={LABEL}>Title</span>
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
							<span className={LABEL}>Category (optional)</span>
							<TextField
								value={category}
								onChange={setCategory}
								placeholder="e.g. Interior Design"
								autoCapitalize="words"
							/>
						</div>

						<div>
							<span className={LABEL}>Description (optional)</span>
							<TextField
								value={description}
								onChange={setDescription}
								placeholder="Describe the project"
								multiline
								rows={3}
							/>
						</div>

						<div>
							<span className={LABEL}>Address</span>
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
									const src = photo.kind === "new" ? photo.preview : photo.url;
									return (
										<div key={photo.id} className="relative h-20 w-20">
											<button
												type="button"
												onClick={() => setCoverId(photo.id)}
												aria-label={isCover ? "Cover photo" : "Set as cover"}
												className={`relative block h-full w-full overflow-hidden rounded-xl border-2 ${
													isCover ? "border-primary" : "border-line"
												}`}
											>
												<img
													src={src}
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
							) : isEdit ? (
								"Save Changes"
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
