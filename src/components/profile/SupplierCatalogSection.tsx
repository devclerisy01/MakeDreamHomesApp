import { IonIcon, useIonAlert } from "@ionic/react";
import { addOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";

import { Lightbox, type LightboxImage } from "@/components/common/Lightbox";
import { PortfolioGridSkeleton } from "@/components/common/Skeletons";
import { PortfolioTile } from "@/components/profile/PortfolioTile";
import { SupplierCategoryModal } from "@/components/profile/SupplierCategoryModal";
import { SupplierProductModal } from "@/components/profile/SupplierProductModal";
import { me } from "@/lib/api/auth";
import {
	deleteSupplierCategory,
	deleteSupplierProduct,
	getMySupplierCatalog,
	getSupplierCategoryOptions,
	type SupplierCategory,
	type SupplierCategoryOption,
	type SupplierProduct,
} from "@/lib/api/supplier-catalog";
import { setStoredUser } from "@/lib/auth/session";
import { getImageSrc } from "@/lib/format";
import { SECTION_HEAD, SECTION_TITLE } from "@/lib/ui";

type CategoryModal = { mode: "add" } | { mode: "edit"; categoryId: string };
type ProductModal = { userDetailsId?: string; product?: SupplierProduct };

const addBtn =
	"grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-primary active:bg-surface-muted";
const emptyBox =
	"m-0 rounded-2xl border border-dashed border-line bg-surface-muted px-4 py-6 text-center text-[13px] text-muted-light";

/**
 * Supplier catalog dashboard (P18/P19) — Categories (name + brands + authorized
 * dealers) and Products (title + images + brand tags), each with add/edit/remove.
 * Replaces the generic Portfolio section for suppliers (P17). Self-fetching;
 * refreshes the cached user after changes (keeps supplierProductIds in sync).
 */
export function SupplierCatalogSection() {
	const [presentAlert] = useIonAlert();
	const [categories, setCategories] = useState<SupplierCategory[] | null>(null);
	const [options, setOptions] = useState<SupplierCategoryOption[]>([]);
	const [categoryModal, setCategoryModal] = useState<CategoryModal | null>(
		null,
	);
	const [productModal, setProductModal] = useState<ProductModal | null>(null);
	const [lightbox, setLightbox] = useState<{
		images: LightboxImage[];
		index: number;
	} | null>(null);

	const refresh = useCallback(() => {
		getMySupplierCatalog()
			.then(setCategories)
			.catch(() => setCategories([]));
		// Adding/removing a category changes supplierProductIds → refresh the user.
		me()
			.then(setStoredUser)
			.catch(() => {});
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		getMySupplierCatalog(controller.signal)
			.then((items) => {
				if (!controller.signal.aborted) setCategories(items);
			})
			.catch(() => {
				if (!controller.signal.aborted) setCategories([]);
			});
		getSupplierCategoryOptions(controller.signal)
			.then((opts) => {
				if (!controller.signal.aborted) setOptions(opts);
			})
			.catch(() => {});
		return () => controller.abort();
	}, []);

	const list = categories ?? [];
	const products = list.flatMap((category) =>
		category.products.map((product) => ({ product, category })),
	);

	function confirmDeleteCategory(category: SupplierCategory) {
		void presentAlert({
			header: "Remove category?",
			message: `"${category.categoryName ?? "Category"}" and all of its products will be removed.`,
			buttons: [
				{ text: "Cancel", role: "cancel" },
				{
					text: "Remove",
					role: "destructive",
					handler: () => {
						deleteSupplierCategory(category.userDetailsId)
							.then(refresh)
							.catch(() => {});
					},
				},
			],
		});
	}

	function confirmDeleteProduct(product: SupplierProduct) {
		void presentAlert({
			header: "Delete product?",
			message: `"${product.title}" will be permanently deleted.`,
			buttons: [
				{ text: "Cancel", role: "cancel" },
				{
					text: "Delete",
					role: "destructive",
					handler: () => {
						deleteSupplierProduct(product.id)
							.then(refresh)
							.catch(() => {});
					},
				},
			],
		});
	}

	return (
		<>
			{/* ---- Categories ---- */}
			<section>
				<div className={SECTION_HEAD}>
					<h2 className={SECTION_TITLE}>Categories</h2>
					<button
						type="button"
						aria-label="Add Category"
						className={addBtn}
						onClick={() => setCategoryModal({ mode: "add" })}
					>
						<IonIcon icon={addOutline} className="text-lg" />
					</button>
				</div>
				{categories === null ? (
					<div className="h-20 animate-pulse rounded-2xl bg-surface-muted" />
				) : list.length === 0 ? (
					<p className={emptyBox}>
						No categories yet. Add the categories you deal in.
					</p>
				) : (
					<div className="flex flex-col gap-3">
						{list.map((category) => (
							<div
								key={category.userDetailsId}
								className="rounded-2xl border border-line bg-white p-3.5"
							>
								<div className="flex items-start justify-between gap-2">
									<p className="m-0 text-[14px] font-bold text-ink">
										{category.categoryName ?? "Category"}
									</p>
									<div className="flex shrink-0 gap-1.5">
										{category.categoryId != null ? (
											<button
												type="button"
												onClick={() =>
													setCategoryModal({
														mode: "edit",
														categoryId: String(category.categoryId),
													})
												}
												className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink active:bg-surface-muted"
											>
												Edit
											</button>
										) : null}
										<button
											type="button"
											onClick={() => confirmDeleteCategory(category)}
											className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-danger active:bg-surface-muted"
										>
											Remove
										</button>
									</div>
								</div>
								<BrandRow label="Brands" brands={category.brands} />
								{category.authorizedBrands.length ? (
									<BrandRow
										label="Authorized dealers"
										brands={category.authorizedBrands}
										authorized
									/>
								) : null}
							</div>
						))}
					</div>
				)}
			</section>

			{/* ---- Products ---- */}
			<section>
				<div className={SECTION_HEAD}>
					<h2 className={SECTION_TITLE}>Products</h2>
					<button
						type="button"
						aria-label="Add Product"
						className={addBtn}
						disabled={list.length === 0}
						onClick={() => setProductModal({})}
						style={list.length === 0 ? { opacity: 0.5 } : undefined}
					>
						<IonIcon icon={addOutline} className="text-lg" />
					</button>
				</div>
				{categories === null ? (
					<PortfolioGridSkeleton
						count={4}
						className="grid grid-cols-2 gap-3.5"
					/>
				) : products.length === 0 ? (
					<p className={emptyBox}>
						{list.length === 0
							? "Add a category first, then add products."
							: "No products yet. Add products with brands and photos."}
					</p>
				) : (
					<div className="grid grid-cols-2 gap-3.5">
						{products.map(({ product, category }) => (
							<PortfolioTile
								key={product.id}
								item={{
									id: product.id,
									title: product.title,
									city: category.categoryName ?? undefined,
									image: product.coverImage ?? undefined,
								}}
								pending={product.status === "PENDING"}
								photoCount={product.images.length}
								onEdit={() =>
									setProductModal({
										userDetailsId: category.userDetailsId,
										product,
									})
								}
								onDelete={() => confirmDeleteProduct(product)}
								onOpen={
									product.images.length
										? () =>
												setLightbox({
													images: product.images.map((url) => ({
														src: getImageSrc(url),
														title: product.title,
													})),
													index: 0,
												})
										: undefined
								}
							/>
						))}
					</div>
				)}
			</section>

			<SupplierCategoryModal
				isOpen={categoryModal !== null}
				categoryOptions={options}
				existing={list}
				initialCategoryId={
					categoryModal?.mode === "edit" ? categoryModal.categoryId : undefined
				}
				lockCategory={categoryModal?.mode === "edit"}
				onClose={() => setCategoryModal(null)}
				onSaved={refresh}
			/>

			<SupplierProductModal
				isOpen={productModal !== null}
				categories={list}
				initialUserDetailsId={productModal?.userDetailsId}
				product={productModal?.product}
				onClose={() => setProductModal(null)}
				onSaved={refresh}
			/>

			{lightbox ? (
				<Lightbox
					images={lightbox.images}
					index={lightbox.index}
					onIndexChange={(i) =>
						setLightbox((lb) => (lb ? { ...lb, index: i } : lb))
					}
					onClose={() => setLightbox(null)}
				/>
			) : null}
		</>
	);
}

/** A labelled row of brand chips (authorized ones badged green). */
function BrandRow({
	label,
	brands,
	authorized = false,
}: {
	label: string;
	brands: { id: number; name: string }[];
	authorized?: boolean;
}) {
	return (
		<div className="mt-2 flex flex-wrap items-center gap-1.5">
			<span className="text-[11px] font-semibold text-muted">{label}:</span>
			{brands.length ? (
				brands.map((b) => (
					<span
						key={b.id}
						className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[10px] font-semibold ${
							authorized
								? "border-success/30 bg-success/10 text-success"
								: "border-line bg-surface-muted text-muted"
						}`}
					>
						{b.name}
					</span>
				))
			) : (
				<span className="text-[11px] text-muted-light">None</span>
			)}
		</div>
	);
}
