import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";

/**
 * Supplier catalog — the signed-in supplier's Categories (each with brands +
 * authorized dealers) and Products (title + images + brand tags). Mirrors the
 * web `lib/api/supplier-catalog.ts`; all mutations are auth'd.
 */

/** Moderation status shared by categories and products. */
export type CatalogStatus = "PENDING" | "APPROVED" | "REJECTED";

/** A brand resolved to its display name. */
export interface BrandRef {
	id: number;
	name: string;
}

/** A master category (for the "Add category" picker) with its available brands. */
export interface SupplierCategoryOption {
	/** supplier_products id (as string). */
	value: string;
	name: string;
	availableBrands: BrandRef[];
}

/** A single supplier product (title + images + brand tags). */
export interface SupplierProduct {
	id: string;
	title: string;
	status: CatalogStatus;
	coverImage: string | null;
	images: string[];
	/** Raw bucket keys (first = cover) — resend on edit to keep existing images. */
	imageKeys: string[];
	brandIds: number[];
	brands: BrandRef[];
	authorizedBrands: BrandRef[];
	createdAt: string;
}

/** One selected category with its chosen/available brands and its products. */
export interface SupplierCategory {
	userDetailsId: string;
	categoryId: number | null;
	categoryName: string | null;
	status: CatalogStatus;
	brands: BrandRef[];
	authorizedBrands: BrandRef[];
	availableBrands: BrandRef[];
	products: SupplierProduct[];
}

export interface CreateSupplierProductPayload {
	title: string;
	/** Ordered bucket keys from the presign flow (first = cover). */
	images?: string[];
	brandIds?: number[];
}

export interface UpdateSupplierProductPayload {
	title?: string;
	/** Full ordered replace (first = cover): kept keys + newly-uploaded keys. */
	images?: string[];
	brandIds?: number[];
}

export interface UpsertCategoryPayload {
	categoryId: number;
	brandIds: number[];
	authorizedBrandIds: number[];
}

/** The signed-in supplier's categories with brands + products. */
export function getMySupplierCatalog(
	signal?: AbortSignal,
): Promise<SupplierCategory[]> {
	return apiGet<SupplierCategory[]>("/app/supplier-catalog/me", {
		auth: true,
		signal,
	});
}

/** Add or edit a category (by supplier_products id) with its brands + dealers. */
export function upsertSupplierCategory(
	payload: UpsertCategoryPayload,
): Promise<SupplierCategory> {
	return apiPost<SupplierCategory>("/app/supplier-catalog/category", payload, {
		auth: true,
	});
}

/** Add a product under one of the supplier's categories. */
export function createSupplierProduct(
	userDetailsId: string,
	payload: CreateSupplierProductPayload,
): Promise<SupplierProduct> {
	return apiPost<SupplierProduct>(
		`/app/supplier-catalog/category/${userDetailsId}/products`,
		payload,
		{ auth: true },
	);
}

/** Edit one of the supplier's products. */
export function updateSupplierProduct(
	id: string,
	payload: UpdateSupplierProductPayload,
): Promise<SupplierProduct> {
	return apiPatch<SupplierProduct>(
		`/app/supplier-catalog/products/${id}`,
		payload,
	);
}

/** Delete one of the supplier's products. */
export function deleteSupplierProduct(id: string): Promise<unknown> {
	return apiDelete<unknown>(`/app/supplier-catalog/products/${id}`);
}

/** Remove a category (and its products) by its user_details id. */
export function deleteSupplierCategory(
	userDetailsId: string,
): Promise<unknown> {
	return apiDelete<unknown>(`/app/supplier-catalog/category/${userDetailsId}`);
}

/** Master supplier categories (with available brands) for the "Add" picker (public). */
export async function getSupplierCategoryOptions(
	signal?: AbortSignal,
): Promise<SupplierCategoryOption[]> {
	const rows = await apiGet<
		{ id: string | number; name: string; brands?: BrandRef[] }[]
	>("/app/supplier-products", { signal });
	return (rows ?? []).map((row) => ({
		value: String(row.id),
		name: row.name,
		availableBrands: row.brands ?? [],
	}));
}
