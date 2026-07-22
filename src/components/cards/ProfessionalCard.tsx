import { IonIcon, IonRouterLink, useIonRouter } from "@ionic/react";
import { type MouseEvent, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import { ListingBadge } from "@/components/common/ListingBadge";
import { SaveButton } from "@/components/common/SaveButton";
import { CATEGORY_PLACEHOLDER_ICON } from "@/constants/categories";
import { REVIEW_SUB_CATEGORIES } from "@/constants/reviews";
import {
	encodeProfessionalId,
	professionalHref,
	ROUTES,
} from "@/constants/routes";
import { getImageSrc } from "@/lib/format";
import { CARD, TAG_MUTED, TAG_PRIMARY } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type {
	DirectoryCategoryId,
	ProfessionalListing,
	ShowcaseKind,
} from "@/types";

/** Label above the thumbnail strip, by showcase kind (mirrors the web card). */
const SHOWCASE_LABEL: Record<ShowcaseKind, string> = {
	portfolio: "Projects",
	properties: "Properties",
	products: "Products",
};

/** Track → display label for the badge (Saved "All" view, where there's no tab). */
const TRACK_LABEL: Record<DirectoryCategoryId, string> = {
	professionals: "Professional",
	"property-dealers": "Property Dealer",
	"material-suppliers": "Material Supplier",
};

/** A "Label: a, b, c +N" meta line (supplier products / brands). */
function MetaLine({
	label,
	items,
	max = 3,
}: {
	label: string;
	items: string[];
	max?: number;
}) {
	if (!items.length) return null;
	const shown = items.slice(0, max);
	const extra = items.length - shown.length;
	return (
		<p className="m-0 text-[9px] leading-tight text-ink/80">
			<span className="font-semibold text-ink">{label}: </span>
			{shown.join(", ")}
			{extra > 0 ? (
				<span className="font-semibold text-primary">{` +${extra}`}</span>
			) : null}
		</p>
	);
}

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
	const router = useIonRouter();
	const [showRatings, setShowRatings] = useState(false);

	const isSupplier = pro.category === "material-suppliers";
	const thumbs = pro.showcase?.items?.slice(0, 2) ?? [];
	const leads = pro.leadCount ?? 0;
	const showcaseLabel = SHOWCASE_LABEL[pro.showcase?.kind ?? "portfolio"];
	const extraThumbs = Math.max(
		0,
		(pro.showcase?.count ?? thumbs.length) - thumbs.length,
	);
	const hasRatings = pro.reviewCount > 0 && !!pro.categoryAverages;
	// Suppliers count "Deals"; everyone else counts "Leads" (mirrors the web).
	const leadNoun = isSupplier ? "Active Deal" : "Active Lead";
	// Suppliers show product + brand text instead of a thumbnail strip (web parity).
	const productTitles = isSupplier
		? (pro.showcase?.items ?? [])
				.map((item) => item.title)
				.filter((title): title is string => !!title)
		: [];
	const brands = pro.brands ?? [];

	// Deep-link to this pro's leads without triggering the card's detail link.
	function openLeads(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		router.push(`${ROUTES.leads}?userId=${encodeProfessionalId(pro.id)}`);
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
				<div className="h-[93px] w-[93px] shrink-0 overflow-hidden rounded-[5px]">
					<Avatar
						name={pro.name}
						image={pro.image}
						fill
						fallbackIcon={CATEGORY_PLACEHOLDER_ICON[pro.category]}
					/>
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-[4px]">
					<div className="flex items-start justify-between gap-2">
						<div className="flex min-w-0 flex-wrap items-center gap-1">
							{showTrackBadge ? (
								<span className={TAG_PRIMARY}>{TRACK_LABEL[pro.category]}</span>
							) : null}
							{pro.category === "professionals" && pro.profession ? (
								<span className={TAG_MUTED}>{pro.profession}</span>
							) : null}
							<ListingBadge item={pro} />
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
									{pro.reviewCount} Reviews
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
									<span className="truncate text-muted">{cat.shortLabel}</span>
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

					{/* Figma: SemiBold 10px, #26428B */}
					{leads > 0 ? (
						<button
							type="button"
							onClick={openLeads}
							className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-primary"
						>
							<IonIcon icon={ICONS.activeLeads} className="text-[12px]" />
							{leads} {leadNoun}
							{leads > 1 ? "s" : ""}
						</button>
					) : null}

					{isSupplier ? (
						/* Suppliers: product + brand text under the description (web parity). */
						<div className="mt-0.5 flex flex-col gap-1">
							<p className="m-0 line-clamp-2 text-[9px] leading-tight text-ink/80">
								{pro.description}
							</p>
							<MetaLine label="Products" items={productTitles} />
							<MetaLine label="Brands" items={brands} />
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
