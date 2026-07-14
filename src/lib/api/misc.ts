import { apiGet } from "@/lib/api/client";

/** A selectable category/product option (professional trades, supplier products). */
export interface CategoryOption {
	id: number;
	value: string;
}

interface CategoryRow {
	id: string | number;
	name: string;
}

function toOptions(rows: CategoryRow[]): CategoryOption[] {
	return rows.map((row) => ({ id: Number(row.id), value: row.name }));
}

/** Professional trades for the "Type of Professional" picker (public). */
export async function getProfessionalCategories(
	signal?: AbortSignal,
): Promise<CategoryOption[]> {
	const rows = await apiGet<CategoryRow[]>(
		"/app/misc/professional-categories",
		{ signal },
	);
	return toOptions(rows);
}

/** Material-supplier product categories for the "Product Categories" picker (public). */
export async function getMaterialCategories(
	signal?: AbortSignal,
): Promise<CategoryOption[]> {
	const rows = await apiGet<CategoryRow[]>(
		"/app/misc/material-supplier-categories",
		{ signal },
	);
	return toOptions(rows);
}
