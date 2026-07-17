/**
 * Central icon registry for the app.
 *
 * Every icon used in the UI is referenced here by a **semantic name** (what it
 * means, not what it looks like). Components import from this file — never from
 * `ionicons/icons` directly — so swapping an icon is a one-line change here that
 * propagates everywhere.
 *
 * ── How to swap in a custom (Figma) icon ──────────────────────────────────
 * `IonIcon`'s `icon=` prop accepts any of:
 *   1. an Ionicons import (the current defaults below), or
 *   2. a URL/data-URI string pointing at an SVG.
 *
 * To use a custom SVG, either:
 *   • drop the file in `src/assets/icons/foo.svg` and import it:
 *       import fooUrl from "@/assets/icons/foo.svg";  // Vite gives a URL string
 *       export const ICONS = { ...  foo: fooUrl  ... }
 *   • or inline it as a data-URI with the `svg()` helper below:
 *       export const ICONS = { ...  foo: svg(`<svg …>…</svg>`)  ... }
 *
 * Share the icon and tell me its semantic name; I replace that one entry.
 *
 * NOTE for inline SVGs: use `fill="currentColor"` (or `stroke="currentColor"`)
 * inside the SVG so the icon inherits the surrounding text color, exactly like
 * Ionicons do — then `className="text-primary"` etc. keeps working.
 */
import {
	addOutline,
	alertCircleOutline,
	arrowForward,
	cameraOutline,
	checkmark,
	checkmarkOutline,
	chevronBackOutline,
	chevronDownOutline,
	chevronForwardOutline,
	closeOutline,
	createOutline,
	cubeOutline,
	globeOutline,
	heart,
	heartOutline,
	imageOutline,
	informationCircleOutline,
	locateOutline,
	logOutOutline,
	micOutline,
	optionsOutline,
	peopleOutline,
	personOutline,
	search,
	shareSocialOutline,
	starHalf,
	starOutline,
	timeOutline,
} from "ionicons/icons";

/* Custom Figma SVGs (Vite resolves each import to a URL string usable by
   IonIcon's `icon=` prop). Stroke/fill uses `currentColor` so tab tinting and
   text-color utilities keep working — except sparkles (white, on a black
   button) and star (fixed gold), which are intentionally fixed-color. */
import iconActiveLeads from "@/assets/icons/active-leads.svg";
import iconBudget from "@/assets/icons/budget.svg";
import iconCategoryProperty from "@/assets/icons/category-property.svg";
import iconInfo from "@/assets/icons/info.svg";
import iconLocation from "@/assets/icons/location.svg";
import iconMenu from "@/assets/icons/menu.svg";
import iconMicSolid from "@/assets/icons/mic-solid.svg";
import iconReqMaterial from "@/assets/icons/req-material.svg";
import iconReqProfessionals from "@/assets/icons/req-professionals.svg";
import iconReqProperty from "@/assets/icons/req-property.svg";
import iconNotifications from "@/assets/icons/notifications.svg";
import iconSparkles from "@/assets/icons/sparkles.svg";
import iconStarFill from "@/assets/icons/star-fill.svg";
import iconTabHome from "@/assets/icons/tab-home.svg";
import iconTabLeads from "@/assets/icons/tab-leads.svg";
import iconTabProfessionals from "@/assets/icons/tab-professionals.svg";
import iconTabProfile from "@/assets/icons/tab-profile.svg";
import iconTabRequirement from "@/assets/icons/tab-requirement.svg";

/**
 * Wrap a raw inline SVG string as a data-URI usable by `IonIcon`'s `icon=` prop.
 * Use `currentColor` for fills/strokes inside the SVG so it inherits text color.
 */
export function svg(markup: string): string {
	return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;
}

/**
 * The registry. Keys are semantic; values are icon sources (Ionicons import or
 * SVG URL/data-URI string). Grouped by area for easy scanning.
 */
export const ICONS = {
	// ── Brand / search ──────────────────────────────────────────────────
	/** Left adornment inside the home search bar. (custom) */
	searchHint: iconInfo,
	/** The black "AI" submit button in the home search bar. (custom, white) */
	searchSubmit: iconSparkles,
	/** Generic magnifier (directory/search inputs). */
	search: search,
	/** Voice input affordance. */
	mic: micOutline,
	/** Solid mic glyph for the "Tap to Speak" pill (custom Figma). */
	micSolid: iconMicSolid,

	// ── Requirement type cards (custom Figma glyphs) ────────────────────
	reqProfessionals: iconReqProfessionals, // hard-hat
	reqProperty: iconReqProperty, // house
	reqMaterial: iconReqMaterial, // stacked blocks

	// ── Bottom tab bar ──────────────────────────────────────────────────
	tabHome: iconTabHome, // custom
	tabLeads: iconTabLeads, // custom
	tabRequirement: iconTabRequirement, // custom (plus in circle)
	tabProfessionals: iconTabProfessionals, // custom (hard-hat)
	tabProfile: iconTabProfile, // custom (person + sparkle)
	tabLogin: iconTabProfile, // custom (person + sparkle, same as profile)

	// ── Header ──────────────────────────────────────────────────────────
	menu: iconMenu, // custom (breadcrumb menu)
	back: chevronBackOutline,
	language: globeOutline,
	notifications: iconNotifications, // custom (bell + badge)

	// ── Lead categories (LeadCard tile) ─────────────────────────────────
	categoryProperty: iconCategoryProperty, // custom (house)
	categoryMaterial: cubeOutline,
	categoryProfessional: iconActiveLeads, // custom (two people)

	// ── Card / listing meta ─────────────────────────────────────────────
	location: iconLocation, // custom
	locate: locateOutline,
	budget: iconBudget, // custom (wallet)
	activeLeads: iconActiveLeads, // custom (two people)
	time: timeOutline,
	lead: iconTabLeads, // custom (same document glyph as the Leads tab)
	professional: personOutline,
	professionals: peopleOutline,

	// ── Ratings ─────────────────────────────────────────────────────────
	star: iconStarFill, // custom (fixed gold)
	starHalf: starHalf,
	starEmpty: starOutline,

	// ── Save / share ────────────────────────────────────────────────────
	saved: heart,
	save: heartOutline,
	share: shareSocialOutline,

	// ── Actions / controls ──────────────────────────────────────────────
	arrowForward: arrowForward,
	chevronDown: chevronDownOutline,
	chevronForward: chevronForwardOutline,
	close: closeOutline,
	add: addOutline,
	edit: createOutline,
	check: checkmark,
	checkOutline: checkmarkOutline,
	filters: optionsOutline,
	logout: logOutOutline,

	// ── Media / status ──────────────────────────────────────────────────
	camera: cameraOutline,
	image: imageOutline,
	info: informationCircleOutline,
	alert: alertCircleOutline,
} as const;

/** Semantic icon name — the keys of {@link ICONS}. */
export type IconName = keyof typeof ICONS;
