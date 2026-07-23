import { IonIcon, IonModal } from "@ionic/react";
import { closeOutline, imageOutline } from "ionicons/icons";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

import { CategoryChips } from "@/components/common/CategoryChips";
import { TextField } from "@/components/common/TextField";
import { UI_MESSAGES } from "@/constants/messages";
import {
	createSupplierProduct,
	type SupplierCategory,
	type SupplierProduct,
	updateSupplierProduct,
} from "@/lib/api/supplier-catalog";
import { toastError } from "@/lib/api/toast";
import { uploadImageViaPresign } from "@/lib/api/uploads";

interface Props {
	isOpen: boolean;
	/** The supplier's added categories (with brands + products). */
	categories: SupplierCategory[];
	/** Category (userDetailsId) to preselect; omit to default to the first. */
	initialUserDetailsId?: string;
	/** Present ⇒ edit mode (category fixed). */
	product?: SupplierProduct | null;
	onClose: () => void;
	onSaved: () => void;
}

type Photo =
	| { kind: "existing"; id: string; key: string; url: string }
	| { kind: "new"; id: string; file: File; preview: string };

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

let localSeq = 0;
const newLocalId = () => `local-${++localSeq}`;

/** Add/edit a supplier product (P19): category + brand tags + title + images. */
export function SupplierProductModal({
	isOpen,
	categories,
	initialUserDetailsId,
	product = null,
	onClose,
	onSaved,
}: Props) {
	const isEdit = Boolean(product);
	const [userDetailsId, setUserDetailsId] = useState("");
	const [title, setTitle] = useState("");
	const [brandIds, setBrandIds] = useState<number[]>([]);
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [coverId, setCoverId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const category = useMemo(
		() => categories.find((c) => c.userDetailsId === userDetailsId),
		[categories, userDetailsId],
	);
	const authorizedSet = new Set(
		(category?.authorizedBrands ?? []).map((b) => b.id),
	);
	const brandOptions = (category?.brands ?? []).map((b) => ({
		id: b.id,
		value: authorizedSet.has(b.id) ? `${b.name} ✓` : b.name,
	}));

	// Seed the form each time the sheet opens.
	useEffect(() => {
		if (!isOpen) return;
		setUserDetailsId(
			initialUserDetailsId ?? categories[0]?.userDetailsId ?? "",
		);
		setTitle(product?.title ?? "");
		setBrandIds(product?.brandIds ?? []);
		setError(null);
		setPhotos((prev) => {
			for (const p of prev)
				if (p.kind === "new") URL.revokeObjectURL(p.preview);
			return (product?.imageKeys ?? []).map((key, i) => ({
				kind: "existing" as const,
				id: key,
				key,
				url: product?.images[i] ?? key,
			}));
		});
		setCoverId((product?.imageKeys ?? [])[0] ?? null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	// Revoke object URLs on unmount.
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
				if (!file.type.startsWith("image/")) continue;
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
			setCoverId((c) => c ?? next[0]?.id ?? null);
			return next;
		});
	}

	function removePhoto(id: string) {
		setPhotos((prev) => {
			const target = prev.find((p) => p.id === id);
			if (target?.kind === "new") URL.revokeObjectURL(target.preview);
			const next = prev.filter((p) => p.id !== id);
			setCoverId((c) => (c === id ? (next[0]?.id ?? null) : c));
			return next;
		});
	}

	async function save() {
		if (saving) return;
		if (!userDetailsId) {
			setError("Please select a category.");
			return;
		}
		if (!title.trim()) {
			setError("Please enter a product title.");
			return;
		}
		if (photos.length === 0) {
			setError("Please add at least one photo.");
			return;
		}
		setSaving(true);
		try {
			// Upload new photos, then build the ordered key list (cover first).
			const newPhotos = photos.filter((p) => p.kind === "new");
			const keyById = new Map<string, string>();
			try {
				await Promise.all(
					newPhotos.map(async (p) => {
						if (p.kind === "new")
							keyById.set(
								p.id,
								await uploadImageViaPresign(p.file, "products"),
							);
					}),
				);
			} catch {
				toastError(UI_MESSAGES.photosUploadFailed);
				return;
			}
			const keyOf = (p: Photo) =>
				p.kind === "existing" ? p.key : (keyById.get(p.id) ?? "");
			const ordered = photos.map(keyOf).filter(Boolean);
			const coverPhoto = photos.find((p) => p.id === coverId);
			const coverKey = coverPhoto ? keyOf(coverPhoto) : ordered[0];
			const images = coverKey
				? [coverKey, ...ordered.filter((k) => k !== coverKey)]
				: ordered;

			const payload = { title: title.trim(), images, brandIds };
			if (isEdit && product) {
				await updateSupplierProduct(product.id, payload);
			} else {
				await createSupplierProduct(userDetailsId, payload);
			}
			onSaved();
			onClose();
		} catch {
			// Failures toasted centrally; keep the sheet open to retry.
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
					<h2 className="m-0 text-base font-extrabold text-ink">
						{isEdit ? "Edit product" : "Add product"}
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
							<span className={LABEL}>Category</span>
							<div className="flex flex-wrap gap-2">
								{categories.map((c) => {
									const active = c.userDetailsId === userDetailsId;
									return (
										<button
											key={c.userDetailsId}
											type="button"
											disabled={saving || isEdit}
											onClick={() => setUserDetailsId(c.userDetailsId)}
											className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-60 ${
												active
													? "border-primary bg-primary text-white"
													: "border-line bg-white text-muted"
											}`}
										>
											{c.categoryName ?? "Category"}
										</button>
									);
								})}
							</div>
						</div>

						{brandOptions.length ? (
							<div>
								<span className={LABEL}>Brands</span>
								<CategoryChips
									options={brandOptions}
									selected={brandIds}
									disabled={saving}
									onChange={setBrandIds}
								/>
							</div>
						) : (
							<p className="text-[12px] text-muted-light">
								This category has no brands yet — add them from Edit category.
							</p>
						)}

						<div>
							<span className={LABEL}>Name</span>
							<TextField
								value={title}
								onChange={(value) => {
									setTitle(value);
									if (error) setError(null);
								}}
								placeholder="e.g. UltraTech PPC Cement 50kg"
								autoCapitalize="words"
							/>
						</div>

						<div>
							<span className={LABEL}>Images</span>
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

						{error ? (
							<p className="m-0 text-[13px] text-danger">{error}</p>
						) : null}
					</div>
				</div>
			</div>
		</IonModal>
	);
}
