import { IonIcon } from "@ionic/react";
import { useState } from "react";

import { LeadDetailsModal } from "@/components/cards/LeadDetailsModal";
import { Lightbox } from "@/components/common/Lightbox";
import { SaveButton } from "@/components/common/SaveButton";
import { assetUrl } from "@/lib/asset";
import { leadBaseCategory, leadIntentChip } from "@/lib/api/leads";
import { formatBudget, timeAgo } from "@/lib/format";
import { CARD } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type { Lead, LeadCategoryId } from "@/types";

const CATEGORY_ICON: Record<LeadCategoryId, string> = {
	property: ICONS.categoryProperty,
	material: ICONS.categoryMaterial,
	professional: ICONS.categoryProfessional,
};

export function LeadCard({
	lead,
	onSaveToggle,
	owned = false,
	showSave = true,
}: {
	lead: Lead;
	onSaveToggle?: (saved: boolean) => void;
	/** The signed-in user's own lead — hides the save heart. */
	owned?: boolean;
	/** Hide the save heart (e.g. the Home feed, which matches the clean design). */
	showSave?: boolean;
}) {
	const intent = leadIntentChip(lead.category);
	// Buy → blue; Sell → rose (per design).
	const intentColor =
		intent === "Buy"
			? "border-blue-200 text-blue-600"
			: "border-rose-200 text-rose-600";
	const icon = CATEGORY_ICON[leadBaseCategory(lead.category)];
	// Card heading shows the full requirement text (description), falling back to
	// the short summary when no description is present.
	const title = lead.description?.trim() || lead.summary?.trim() || "";
	const budget = formatBudget(lead.budget);
	const allTags = lead.tags ?? [];
	const tags = allTags.slice(0, 5);
	const extraTags = allTags.length - tags.length;
	const posted = timeAgo(lead.createdAt);
	// Prefer the full set of preferred localities; fall back to the flat location.
	const localityLabel = lead.localities?.length
		? lead.localities.join(" | ")
		: lead.location;
	const images = (lead.images ?? [])
		.map((src) => assetUrl(src))
		.filter((src): src is string => Boolean(src));

	const [detailsOpen, setDetailsOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	return (
		<>
			<div
				className={`cursor-pointer p-3 ${CARD}`}
				onClick={() => setDetailsOpen(true)}
			>
				<div className="flex gap-3">
					<div className="relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-md bg-[#f2f4f7]">
						{/* Figma: 21×21, #14181F */}
						<IonIcon icon={icon} className="text-[21px] text-[#14181f]" />
						{/* BUY/SELL badge overlaps the bottom edge of the icon tile. */}
						{intent ? (
							<span
								className={`absolute -bottom-1.5 left-1/2 flex h-[14px] -translate-x-1/2 items-center justify-center rounded-[4px] border bg-white px-1.5 text-[7.5px] font-black uppercase tracking-wider shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${intentColor}`}
							>
								{intent}
							</span>
						) : null}
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<h3 className="m-0 line-clamp-2 text-[12px] font-bold leading-snug text-ink">
								{title}
							</h3>
							{owned || !showSave ? null : (
								<SaveButton
									entityType="leads"
									entityId={lead.id}
									onToggle={onSaveToggle}
								/>
							)}
						</div>
						<div className="mt-2 flex flex-wrap items-center gap-1.5">
							{/* Figma: Medium 8px, #6F7791, bg #F1F4FC, border #D7DDED, radius 4 */}
							{tags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center whitespace-nowrap rounded-[4px] border border-[#d7dded] bg-[#f1f4fc] px-[7px] py-1 text-[8px] font-medium capitalize leading-none text-[#6f7791]"
								>
									{tag}
								</span>
							))}
							{extraTags > 0 ? (
								<span className="inline-flex items-center whitespace-nowrap rounded-[4px] border border-[#d7dded] bg-white px-[7px] py-1 text-[8px] font-bold leading-none text-[#6f7791]">
									+{extraTags}
								</span>
							) : null}
							{posted ? (
								<span className="ml-auto whitespace-nowrap text-[10px] text-[#868686]">
									{posted}
								</span>
							) : null}
						</div>
					</div>
				</div>
				{/* Requirement image thumbnails → open the lightbox (tap doesn't
					    bubble to the card's details-modal open). */}
				{images.length > 0 ? (
					<div
						className="mt-2.5 flex gap-1.5"
						onClick={(event) => event.stopPropagation()}
					>
						{images.slice(0, 4).map((src, i) => (
							<button
								key={i}
								type="button"
								onClick={() => setLightboxIndex(i)}
								className="h-11 w-11 overflow-hidden rounded-md border border-line"
							>
								<img
									src={src}
									alt=""
									loading="lazy"
									className="h-full w-full object-cover"
								/>
							</button>
						))}
						{images.length > 4 ? (
							<button
								type="button"
								onClick={() => setLightboxIndex(4)}
								className="grid h-11 w-11 place-items-center rounded-md border border-line bg-surface-muted text-[11px] font-bold text-muted"
							>
								+{images.length - 4}
							</button>
						) : null}
					</div>
				) : null}

				<div className="mt-2.5 flex items-center justify-between gap-2.5 border-t border-line pt-2.5">
					{/* Figma: Regular 10px, #6F7791 */}
					{localityLabel ? (
						<span className="inline-flex min-w-0 items-center gap-1 text-[10px] text-black">
							<IonIcon icon={ICONS.location} className="shrink-0 text-[12px]" />
							<span className="truncate">{localityLabel}</span>
						</span>
					) : (
						<span />
					)}
					{/* Figma: 10px */}
					{budget ? (
						<span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[10px] text-ink">
							<IonIcon
								icon={ICONS.budget}
								className="text-[12px] text-muted-light"
							/>
							Est. Price: <span className="font-bold">{budget}</span>
						</span>
					) : null}
				</div>
			</div>

			<LeadDetailsModal
				lead={lead}
				isOpen={detailsOpen}
				onClose={() => setDetailsOpen(false)}
				owned={owned}
			/>

			{lightboxIndex !== null ? (
				<Lightbox
					images={images.map((src) => ({ src }))}
					index={lightboxIndex}
					onIndexChange={setLightboxIndex}
					onClose={() => setLightboxIndex(null)}
				/>
			) : null}
		</>
	);
}
