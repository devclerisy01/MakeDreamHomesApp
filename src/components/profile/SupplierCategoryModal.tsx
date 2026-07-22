import { IonModal } from "@ionic/react";
import { useEffect, useMemo, useState } from "react";

import { CategoryChips } from "@/components/common/CategoryChips";
import {
	type SupplierCategory,
	type SupplierCategoryOption,
	upsertSupplierCategory,
} from "@/lib/api/supplier-catalog";

interface Props {
	isOpen: boolean;
	/** Master categories (with their available brands). */
	categoryOptions: SupplierCategoryOption[];
	/** The supplier's current categories (to prefill brands when editing). */
	existing: SupplierCategory[];
	/** supplier_products id to preselect; omit for a fresh "add". */
	initialCategoryId?: string;
	/** Edit mode: category is fixed (can't switch). */
	lockCategory?: boolean;
	onClose: () => void;
	onSaved: () => void;
}

const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

/**
 * Add/edit a supplier category (P18): pick a category from the master list, then
 * its **brands** and which of those are **authorized-dealer** brands. Saves via
 * `upsertSupplierCategory` (creates the supplier's row if new).
 */
export function SupplierCategoryModal({
	isOpen,
	categoryOptions,
	existing,
	initialCategoryId,
	lockCategory = false,
	onClose,
	onSaved,
}: Props) {
	const addedIds = new Set(
		existing.map((c) => (c.categoryId != null ? String(c.categoryId) : "")),
	);
	const firstUnadded = categoryOptions.find(
		(o) => !addedIds.has(o.value),
	)?.value;

	const [categoryId, setCategoryId] = useState("");
	const [brandIds, setBrandIds] = useState<number[]>([]);
	const [authorizedIds, setAuthorizedIds] = useState<number[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const option = useMemo(
		() => categoryOptions.find((o) => o.value === categoryId),
		[categoryOptions, categoryId],
	);
	const availableBrands = option?.availableBrands ?? [];

	// Seed the category on open, then brands/authorized whenever the category changes.
	useEffect(() => {
		if (!isOpen) return;
		setCategoryId(
			initialCategoryId ?? firstUnadded ?? categoryOptions[0]?.value ?? "",
		);
		setError(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	useEffect(() => {
		const cat = existing.find((c) => String(c.categoryId) === categoryId);
		setBrandIds(cat?.brands.map((b) => b.id) ?? []);
		setAuthorizedIds(cat?.authorizedBrands.map((b) => b.id) ?? []);
	}, [categoryId, existing]);

	const brandOptions = availableBrands.map((b) => ({
		id: b.id,
		value: b.name,
	}));
	const authorizedOptions = availableBrands
		.filter((b) => brandIds.includes(b.id))
		.map((b) => ({ id: b.id, value: b.name }));

	async function save() {
		if (saving || !categoryId) return;
		setSaving(true);
		setError(null);
		try {
			await upsertSupplierCategory({
				categoryId: Number(categoryId),
				brandIds,
				authorizedBrandIds: authorizedIds,
			});
			onSaved();
			onClose();
		} catch {
			setError("Couldn't save the category. Please try again.");
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
						{lockCategory ? "Edit Category" : "Add Category"}
					</h2>
					<button
						type="button"
						onClick={save}
						disabled={saving || !categoryId}
						className="text-sm font-bold text-primary disabled:opacity-50"
					>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-4 py-5">
					<div className="mx-auto flex w-full max-w-[460px] flex-col gap-5">
						<div>
							<span className={LABEL}>Category</span>
							<CategoryChips
								options={categoryOptions.map((o) => ({
									id: Number(o.value),
									value: o.name,
								}))}
								selected={categoryId ? [Number(categoryId)] : []}
								single
								disabled={saving || lockCategory}
								onChange={(ids) => setCategoryId(ids[0] ? String(ids[0]) : "")}
							/>
						</div>

						{availableBrands.length === 0 ? (
							<p className="text-sm text-muted-light">
								No brands are configured for this category yet.
							</p>
						) : (
							<>
								<div>
									<span className={LABEL}>Brands</span>
									<CategoryChips
										options={brandOptions}
										selected={brandIds}
										disabled={saving}
										onChange={(ids) => {
											setBrandIds(ids);
											// Drop authorized brands no longer selected.
											setAuthorizedIds((prev) =>
												prev.filter((id) => ids.includes(id)),
											);
										}}
									/>
								</div>
								<div>
									<span className={LABEL}>Authorized dealers</span>
									{brandIds.length === 0 ? (
										<p className="text-[12px] text-muted-light">
											Select brands above to mark authorized dealers.
										</p>
									) : (
										<CategoryChips
											options={authorizedOptions}
											selected={authorizedIds}
											disabled={saving}
											onChange={setAuthorizedIds}
										/>
									)}
								</div>
							</>
						)}

						{error ? (
							<p className="m-0 text-[13px] text-danger">{error}</p>
						) : null}
					</div>
				</div>
			</div>
		</IonModal>
	);
}
