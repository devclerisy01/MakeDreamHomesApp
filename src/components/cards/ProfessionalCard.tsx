import { IonIcon, IonRouterLink, useIonRouter } from "@ionic/react";
import { type MouseEvent, useState } from "react";
import { useTranslations } from "use-intl";

import { Avatar } from "@/components/common/Avatar";
import { ListingBadge } from "@/components/common/ListingBadge";
import { SaveButton } from "@/components/common/SaveButton";
import { SupplierCategories } from "@/components/common/SupplierCategories";
import { listingSupplierCategories } from "@/lib/supplier-categories";
import { CATEGORY_PLACEHOLDER_ICON } from "@/constants/categories";
import { REVIEW_SUB_CATEGORIES } from "@/constants/reviews";
import { professionalHref } from "@/constants/routes";
import { getImageSrc } from "@/lib/format";
import { CARD, TAG_MUTED, TAG_PRIMARY } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type {
	DirectoryCategoryId,
	ProfessionalListing,
	ShowcaseKind,
} from "@/types";

/** Translation key for the label above the thumbnail strip, by showcase kind. */
const SHOWCASE_LABEL_KEY: Record<ShowcaseKind, string> = {
	portfolio: "professional.portfolio",
	properties: "common.properties",
	products: "common.products",
};

/** Track → badge label key (Saved "All" view, where there's no tab). */
const TRACK_LABEL_KEY: Record<DirectoryCategoryId, string> = {
	professionals: "join.roles.professional.title",
	"property-dealers": "join.roles.dealer.title",
	"material-suppliers": "join.roles.supplier.title",
};

export function ProfessionalCard({
	pro,
	onSaveToggle,
	showSave = true,
	showTrackBadge = false,
}: {
	pro: ProfessionalListing;
	onSaveToggle?: (saved: boolean) => void;
	/** Hide the save heart (e.g. the Home feed, which matches the clean design). */
	showSave?: boolean;
	/** Show the track badge (Professional / Property Dealer / Material Supplier)
	 *  for every track — used on the mixed Saved list where there's no tab. */
	showTrackBadge?: boolean;
}) {
	const translate = useTranslations();
	const router = useIonRouter();
	const [showRatings, setShowRatings] = useState(false);

	const isSupplier = pro.category === "material-suppliers";
	const thumbs = pro.showcase?.items?.slice(0, 2) ?? [];
	const leads = pro.leadCount ?? 0;
	const showcaseLabel = translate(
		SHOWCASE_LABEL_KEY[pro.showcase?.kind ?? "portfolio"],
	);
	const extraThumbs = Math.max(
		0,
		(pro.showcase?.count ?? thumbs.length) - thumbs.length,
	);
	const hasRatings = pro.reviewCount > 0 && !!pro.categoryAverages;
	// Suppliers count "Deals"; everyone else counts "Leads" (mirrors the web).
	// Pluralised via the shared common.active{Deal,Lead}[s] keys.
	const leadNoun = isSupplier
		? translate(leads > 1 ? "common.activeDeals" : "common.activeDeal")
		: translate(leads > 1 ? "common.activeLeads" : "common.activeLead");
	// Suppliers show a tappable product count (→ detail Products section).
	const productCount = pro.showcase?.count ?? 0;

	// Open this pro's detail page and scroll to its Active Leads/Deals section
	// (mirrors the web card's `section="leads"` link). `preventDefault` stops the
	// card's own detail link from also firing.
	function openLeads(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		router.push(`${professionalHref(pro.id)}?section=leads`);
	}

	// Open this pro's detail page and scroll to its Products/Portfolio section.
	function openProducts(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		router.push(`${professionalHref(pro.id)}?section=portfolio`);
	}

	// Toggle the per-category rating breakdown (inside the card link → guard nav).
	function toggleRatings(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		setShowRatings((open) => !open);
	}

	return (
		<IonRouterLink
			routerLink={professionalHref(pro.id)}
			className="block no-underline"
		>
			<article className={`flex items-start gap-3 p-3 ${CARD}`}>
				{/* Figma: 93×93 square, radius 5 */}
				<div className="relative h-[93px] w-[93px] shrink-0 overflow-hidden rounded-[5px]">
					<Avatar
						name={pro.name}
						image={pro.image}
						fill
						fallbackIcon={CATEGORY_PLACEHOLDER_ICON[pro.category]}
					/>
					{/* Trust badge overlaid on the image — matches web. Suppliers show
					    authorization on the category chips instead, not here. */}
					{pro.category !== "material-suppliers" ? (
						<ListingBadge item={pro} className="absolute left-1 top-1 z-10" />
					) : null}
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-[4px]">
					<div className="flex items-start justify-between gap-2">
						<div className="flex min-w-0 flex-wrap items-center gap-1">
							{showTrackBadge ? (
								<span className={TAG_PRIMARY}>
									{translate(TRACK_LABEL_KEY[pro.category])}
								</span>
							) : null}
							{pro.category === "professionals" && pro.profession ? (
								<span className={TAG_MUTED}>{pro.profession}</span>
							) : null}
						</div>
						{hasRatings ? (
							<button
								type="button"
								onClick={toggleRatings}
								aria-expanded={showRatings}
								className="flex shrink-0 items-center gap-[3px] text-[11px] font-medium text-ink"
							>
								<IonIcon icon={ICONS.star} className="text-[12px]" />
								{pro.ratingAverage.toFixed(1)}
								<span className="ml-0.5 text-[10px] font-medium text-primary">
									{translate("professional.reviewsCountShort", {
										count: pro.reviewCount,
									})}
								</span>
								<IonIcon
									icon={ICONS.chevronDown}
									className={`text-[8px] text-muted-light transition-transform ${
										showRatings ? "rotate-180" : ""
									}`}
								/>
							</button>
						) : null}
					</div>

					{/* PC3: per-category averages, revealed on tapping the rating. */}
					{hasRatings && showRatings ? (
						<button
							type="button"
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
							className="mt-0.5 flex cursor-default flex-col gap-1 rounded-[8px] bg-surface-muted/70 px-2.5 py-2 text-left"
						>
							{REVIEW_SUB_CATEGORIES.map((cat) => (
								<span
									key={cat.key}
									className="flex items-center justify-between gap-2 text-[10px] leading-tight"
								>
									<span className="truncate text-muted">
										{translate(cat.shortKey)}
									</span>
									<span className="font-semibold text-ink">
										{(pro.categoryAverages?.[cat.key] ?? 0).toFixed(1)}
									</span>
								</span>
							))}
						</button>
					) : null}

					<div className="flex gap-1 justify-between relative pr-7">
						<h3 className="mt-0.5 text-[12px] font-bold text-ink flex-1 wrap-break-word">
							{pro.name}
						</h3>
						{showSave ? (
							<div className="absolute -top-1 -right-1">
								<SaveButton
									entityType="users"
									entityId={pro.id}
									onToggle={onSaveToggle}
								/>
							</div>
						) : null}
					</div>

					{/* Figma: Regular 10px */}
					{pro.location ? (
						<span className="inline-flex min-w-0 items-center gap-1 text-[10px] text-black">
							<IonIcon icon={ICONS.location} className="shrink-0 text-[12px]" />
							<span className="truncate">{pro.location}</span>
						</span>
					) : null}

					{/* Stat links — Products (suppliers) + Active Leads/Deals. Each opens
					    the detail page scrolled to its section. Figma: SemiBold 10px. */}
					{(isSupplier && productCount > 0) || leads > 0 ? (
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
							{isSupplier && productCount > 0 ? (
								<button
									type="button"
									onClick={openProducts}
									className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-primary"
								>
									<IonIcon icon={ICONS.products} className="text-[12px]" />
									{productCount}{" "}
									{productCount > 1
										? translate("common.products")
										: translate("common.product")}
								</button>
							) : null}
							{leads > 0 ? (
								<button
									type="button"
									onClick={openLeads}
									className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-primary"
								>
									<IonIcon icon={ICONS.activeLeads} className="text-[12px]" />
									{leads} {leadNoun}
								</button>
							) : null}
						</div>
					) : null}

					{isSupplier ? (
						/* Suppliers: description + Categories chips (with per-category
						   brands), matching the web card. */
						<div className="mt-0.5 flex flex-col gap-1.5">
							<p className="m-0 line-clamp-2 text-[9px] leading-tight text-ink/80">
								{pro.description}
							</p>
							<SupplierCategories
								categories={listingSupplierCategories(pro)}
								className="mt-0.5"
							/>
						</div>
					) : (
						<div className="flex items-start justify-between gap-2.5">
							<p className="m-0 line-clamp-2 min-w-0 flex-1 text-[9px] leading-tight text-ink/80">
								{pro.description}
							</p>
							{thumbs.length > 0 ? (
								<div className="shrink-0 text-right relative">
									<span className="mb-1 block text-[10px] font-semibold text-ink absolute bottom-full left-0">
										{showcaseLabel}
									</span>
									<div className="flex gap-1">
										{thumbs.map((thumb) => (
											<img
												key={thumb.id}
												src={getImageSrc(thumb)}
												alt={thumb.title ?? `${showcaseLabel} image`}
												loading="lazy"
												className="h-7 w-8 rounded-[5px] bg-surface-muted object-cover"
											/>
										))}
										{extraThumbs > 0 ? (
											<span className="grid h-7 w-8 shrink-0 place-items-center rounded-[5px] bg-surface-muted text-[9px] font-semibold text-ink">
												+{extraThumbs}
											</span>
										) : null}
									</div>
								</div>
							) : null}
						</div>
					)}
				</div>
			</article>
		</IonRouterLink>
	);
}
