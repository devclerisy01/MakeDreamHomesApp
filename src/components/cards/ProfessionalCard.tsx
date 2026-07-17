import { IonIcon, IonRouterLink, useIonRouter } from "@ionic/react";
import type { MouseEvent } from "react";

import { Avatar } from "@/components/common/Avatar";
import { SaveButton } from "@/components/common/SaveButton";
import {
	encodeProfessionalId,
	professionalHref,
	ROUTES,
} from "@/constants/routes";
import { getImageSrc } from "@/lib/format";
import { CARD, TAG_MUTED } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type { ProfessionalListing } from "@/types";

export function ProfessionalCard({
	pro,
	onSaveToggle,
	showSave = true,
}: {
	pro: ProfessionalListing;
	onSaveToggle?: (saved: boolean) => void;
	/** Hide the save heart (e.g. the Home feed, which matches the clean design). */
	showSave?: boolean;
}) {
	const router = useIonRouter();
	const thumbs = pro.showcase?.items?.slice(0, 2) ?? [];
	const leads = pro.leadCount ?? 0;

	// Deep-link to this pro's leads without triggering the card's detail link.
	function openLeads(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		router.push(`${ROUTES.leads}?userId=${encodeProfessionalId(pro.id)}`);
	}

	return (
		<IonRouterLink
			routerLink={professionalHref(pro.id)}
			className="block no-underline"
		>
			<article className={`flex items-start gap-3 p-3 ${CARD}`}>
				{/* Figma: 93×93 square, radius 5 */}
				<div className="h-[93px] w-[93px] shrink-0 overflow-hidden rounded-[5px]">
					<Avatar name={pro.name} image={pro.image} fill />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-[4px]">
					<div className="flex items-start justify-between gap-2">
						{pro.profession ? (
							<span className={TAG_MUTED}>{pro.profession}</span>
						) : (
							<span />
						)}
						<div className="flex shrink-0 items-center gap-1">
							{pro.reviewCount > 0 ? (
								<span className="inline-flex items-center gap-[3px] text-[11px] font-medium text-ink">
									<IonIcon icon={ICONS.star} className="text-[12px]" />
									{pro.ratingAverage.toFixed(1)}
									<span className="ml-0.5 text-[10px] font-medium text-primary">
										{pro.reviewCount} Reviews
									</span>
								</span>
							) : null}
						</div>
					</div>

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
							{leads} Active Lead{leads > 1 ? "s" : ""}
						</button>
					) : null}

					<div className="flex items-start justify-between gap-2.5">
						<p className="m-0 line-clamp-2 min-w-0 flex-1 text-[9px] leading-tight text-ink/80">
							{pro.description}
						</p>
						{thumbs.length > 0 ? (
							<div className="shrink-0 text-right relative">
								<span className="mb-1 block text-[10px] font-semibold text-ink absolute bottom-full left-0">
									Projects
								</span>
								<div className="flex gap-1">
									{thumbs.map((thumb) => (
										<img
											key={thumb.id}
											src={getImageSrc(thumb)}
											alt={thumb.title ?? "Project image"}
											loading="lazy"
											className="h-7 w-8 rounded-[5px] bg-surface-muted object-cover"
										/>
									))}
								</div>
							</div>
						) : null}
					</div>
				</div>
			</article>
		</IonRouterLink>
	);
}
