import type { ProfessionalListing } from "@/types";

/** One supplier category chip: its name plus the brands it carries (and which
 *  of those the supplier is an authorized dealer of). */
export interface SupplierCategoryCard {
	name: string;
	brands: string[];
	authorizedBrands: string[];
}

/**
 * Build category chips from a directory/home listing. The feed carries a
 * supplier's categories as showcase items (each item's `title` is the category
 * name, with its own `brands`), but authorized-dealer brands arrive as one flat
 * top-level set (`authorizedBrands`). So each category's authorized brands are
 * derived by intersecting its brands with that set (falling back to any per-item
 * authorized list the API already provides). Mirrors the web helper.
 */
export function listingSupplierCategories(
	item: Pick<ProfessionalListing, "showcase" | "authorizedBrands">,
): SupplierCategoryCard[] {
	const authorizedSet = new Set(item.authorizedBrands ?? []);
	return (item.showcase?.items ?? [])
		.map((it) => {
			const brands = it.brands ?? [];
			return {
				name: it.title ?? "",
				brands,
				authorizedBrands: it.authorizedBrands?.length
					? it.authorizedBrands
					: brands.filter((b) => authorizedSet.has(b)),
			};
		})
		.filter((cat) => cat.name);
}
