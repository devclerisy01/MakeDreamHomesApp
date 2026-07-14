import type { DirectoryCategoryId, LeadCategoryId } from "@/types";

export interface Tab<T extends string> {
	id: T;
	label: string;
}

/** Tabs on the Professionals directory (labels match the design). */
export const DIRECTORY_TABS: Tab<DirectoryCategoryId>[] = [
	{ id: "professionals", label: "Professionals" },
	{ id: "property-dealers", label: "Property Dealers" },
	{ id: "material-suppliers", label: "Materials Suppliers" },
];

/** Audience tabs on the Leads screen. */
export const LEAD_TABS: Tab<LeadCategoryId>[] = [
	{ id: "professional", label: "For Professionals" },
	{ id: "property", label: "For Property Dealers" },
	{ id: "material", label: "For Materials Suppliers" },
];

/** Compact audience tabs used in the Home "Latest Leads" section. */
export const HOME_LEAD_TABS: Tab<LeadCategoryId>[] = [
	{ id: "professional", label: "For Professionals" },
	{ id: "property", label: "For Property" },
	{ id: "material", label: "For Materials" },
];

/** Category tabs used in the Home "Find Professionals" section. */
export const HOME_PRO_TABS: Tab<DirectoryCategoryId>[] = [
	{ id: "professionals", label: "Professionals" },
	{ id: "property-dealers", label: "Property Dealers" },
	{ id: "material-suppliers", label: "Material Suppliers" },
];

export const DEFAULT_DIRECTORY_CATEGORY: DirectoryCategoryId = "professionals";
export const DEFAULT_LEAD_CATEGORY: LeadCategoryId = "professional";
