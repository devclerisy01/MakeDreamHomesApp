import { IonIcon, IonRouterLink } from "@ionic/react";
import { locationOutline, people, star } from "ionicons/icons";

import { Avatar } from "@/components/common/Avatar";
import { SaveButton } from "@/components/common/SaveButton";
import { professionalHref } from "@/constants/routes";
import { getImageSrc } from "@/lib/format";
import { CARD, META, TAG_PRIMARY } from "@/lib/ui";
import type { ProfessionalListing } from "@/types";

export function ProfessionalCard({
	pro,
	onSaveToggle,
}: {
	pro: ProfessionalListing;
	onSaveToggle?: (saved: boolean) => void;
}) {
	const thumbs = pro.showcase?.items?.slice(0, 2) ?? [];
	const leads = pro.leadCount ?? 0;

	return (
		<IonRouterLink
			routerLink={professionalHref(pro.id)}
			className="block no-underline"
		>
			<article className={`flex items-stretch gap-3 p-3 ${CARD}`}>
				<div className="w-[88px] shrink-0 self-stretch overflow-hidden rounded-xl">
					<Avatar name={pro.name} image={pro.image} fill />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-[5px]">
					<div className="flex items-start justify-between gap-2">
						{pro.profession ? (
							<span className={TAG_PRIMARY}>{pro.profession}</span>
						) : (
							<span />
						)}
						<div className="flex shrink-0 items-center gap-1">
							{pro.reviewCount > 0 ? (
								<span className="inline-flex items-center gap-[3px] text-[13px] font-bold text-ink">
									<IonIcon icon={star} className="text-sm text-star" />
									{pro.ratingAverage.toFixed(1)}
									<span className="ml-0.5 text-xs font-semibold text-primary">
										{pro.reviewCount} Reviews
									</span>
								</span>
							) : null}
							<SaveButton
								entityType="users"
								entityId={pro.id}
								onToggle={onSaveToggle}
							/>
						</div>
					</div>

					<h3 className="mt-0.5 line-clamp-1 text-base font-extrabold text-ink">
						{pro.name}
					</h3>

					{pro.location ? (
						<span className={META}>
							<IonIcon
								icon={locationOutline}
								className="shrink-0 text-[15px]"
							/>
							<span className="truncate">{pro.location}</span>
						</span>
					) : null}

					{leads > 0 ? (
						<span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary">
							<IonIcon icon={people} className="text-sm" />
							{leads} Active Lead{leads > 1 ? "s" : ""}
						</span>
					) : null}

					<div className="mt-0.5 flex items-end justify-between gap-2.5">
						<p className="m-0 line-clamp-2 min-w-0 flex-1 text-[12.5px] leading-tight text-muted-light">
							{pro.description}
						</p>
						{thumbs.length > 0 ? (
							<div className="shrink-0 text-right">
								<span className="mb-1 block text-[11px] font-bold text-ink">
									Projects
								</span>
								<div className="flex gap-1">
									{thumbs.map((thumb) => (
										<img
											key={thumb.id}
											src={getImageSrc(thumb)}
											alt={thumb.title}
											loading="lazy"
											className="h-9 w-9 rounded-[7px] bg-surface-muted object-cover"
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
