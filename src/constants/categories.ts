import { ICONS } from "@/theme/icons";
import type { DirectoryCategoryId, LeadCategoryId } from "@/types";

export interface Tab<T extends string> {
	id: T;
	/** Translation key (use-intl), resolved to a label by `CategoryTabs`. */
	labelKey: string;
}

/** Per-track avatar placeholder icon shown when a listing has no photo (the app
 *  ships no placeholder images, so we use the track's requirement glyph). */
export const CATEGORY_PLACEHOLDER_ICON: Record<DirectoryCategoryId, string> = {
	professionals: ICONS.reqProfessionals,
	"property-dealers": ICONS.reqProperty,
	"material-suppliers": ICONS.reqMaterial,
};

/** Tabs on the Professionals directory (labels match the design). */
export const DIRECTORY_TABS: Tab<DirectoryCategoryId>[] = [
	{ id: "professionals", labelKey: "findProfessionals.tabs.professionals" },
	{
		id: "property-dealers",
		labelKey: "findProfessionals.tabs.propertyDealers",
	},
	{
		id: "material-suppliers",
		labelKey: "findProfessionals.tabs.materialSuppliers",
	},
];

/** Audience tabs on the Leads screen. */
export const LEAD_TABS: Tab<LeadCategoryId>[] = [
	{ id: "professional", labelKey: "latestLeads.categoryLabel.professional" },
	{ id: "property", labelKey: "latestLeads.categoryLabel.buy_property" },
	{ id: "material", labelKey: "latestLeads.categoryLabel.material" },
];

/** Compact audience tabs used in the Home "Latest Leads" section. */
export const HOME_LEAD_TABS: Tab<LeadCategoryId>[] = [
	{ id: "professional", labelKey: "latestLeads.tabs.professional" },
	{ id: "property", labelKey: "latestLeads.tabs.property" },
	{ id: "material", labelKey: "latestLeads.tabs.material" },
];

/** Category tabs used in the Home "Find Professionals" section. */
export const HOME_PRO_TABS: Tab<DirectoryCategoryId>[] = [
	{ id: "professionals", labelKey: "findProfessionals.tabs.professionals" },
	{
		id: "property-dealers",
		labelKey: "findProfessionals.tabs.propertyDealers",
	},
	{
		id: "material-suppliers",
		labelKey: "findProfessionals.tabs.materialSuppliers",
	},
];

export const DEFAULT_DIRECTORY_CATEGORY: DirectoryCategoryId = "professionals";
export const DEFAULT_LEAD_CATEGORY: LeadCategoryId = "professional";
