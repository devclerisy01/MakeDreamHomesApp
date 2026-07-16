import { IonIcon } from "@ionic/react";
import { useState } from "react";

import { LeadDetailsModal } from "@/components/cards/LeadDetailsModal";
import { SaveButton } from "@/components/common/SaveButton";
import { useClampOverflow } from "@/hooks/useClampOverflow";
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
	showReadMore = true,
}: {
	lead: Lead;
	onSaveToggle?: (saved: boolean) => void;
	/** The signed-in user's own lead — hides the save heart. */
	owned?: boolean;
	/** Hide the save heart (e.g. the Home feed, which matches the clean design). */
	showSave?: boolean;
	/** Hide the "Read more" affordance (Home feed shows a static card). */
	showReadMore?: boolean;
}) {
	const intent = leadIntentChip(lead.category);
	const icon = CATEGORY_ICON[leadBaseCategory(lead.category)];
	const title = lead.summary?.trim() || lead.description;
	const budget = formatBudget(lead.budget);
	const tags = (lead.tags ?? []).slice(0, 3);
	const posted = timeAgo(lead.createdAt);

	// "Read more": reveal when the clamped heading overflows OR there's detail
	// the card doesn't show (a fuller description or images) — opens the popup.
	const { ref: headingRef, overflows } =
		useClampOverflow<HTMLHeadingElement>(title);
	const [detailsOpen, setDetailsOpen] = useState(false);

	const hasFullerDescription = Boolean(
		lead.summary?.trim() &&
		lead.description?.trim() &&
		lead.description.trim() !== lead.summary.trim(),
	);
	const hasMore =
		overflows || hasFullerDescription || (lead.images?.length ?? 0) > 0;

	return (
		<div className={`p-3 ${CARD}`}>
			<div className="flex gap-3">
				<div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-md bg-[#f2f4f7]">
					{/* Figma: 21×21, #14181F */}
					<IonIcon icon={icon} className="text-[21px] text-[#14181f]" />
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<h3
							ref={headingRef}
							className="m-0 line-clamp-2 text-[12px] font-bold leading-snug text-ink"
						>
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
					{showReadMore && hasMore ? (
						<button
							type="button"
							onClick={() => setDetailsOpen(true)}
							className="mt-1 text-xs font-bold text-primary"
						>
							Read more
						</button>
					) : null}
					<div className="mt-2 flex flex-wrap items-center gap-1.5">
						{intent ? (
							<span className="inline-flex items-center rounded-[4px] border border-primary bg-[#e8f1ff] px-1.5 py-1 text-[9px] font-semibold uppercase leading-none tracking-wide text-primary">
								{intent}
							</span>
						) : null}
						{/* Figma: Medium 8px, #6F7791, bg #F1F4FC, border #D7DDED, radius 4 */}
						{tags.map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center whitespace-nowrap rounded-[4px] border border-[#d7dded] bg-[#f1f4fc] px-[7px] py-1 text-[8px] font-medium capitalize leading-none text-[#6f7791]"
							>
								{tag}
							</span>
						))}
						{posted ? (
							<span className="ml-auto whitespace-nowrap text-[10px] text-[#868686]">
								{posted}
							</span>
						) : null}
					</div>
				</div>
			</div>

			<div className="mt-2.5 flex items-center justify-between gap-2.5 border-t border-line pt-2.5">
				{/* Figma: Regular 10px, #6F7791 */}
				{lead.location ? (
					<span className="inline-flex min-w-0 items-center gap-1 text-[10px] text-[#6f7791]">
						<IonIcon icon={ICONS.location} className="shrink-0 text-[12px]" />
						<span className="truncate">{lead.location}</span>
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

			<LeadDetailsModal
				lead={lead}
				isOpen={detailsOpen}
				onClose={() => setDetailsOpen(false)}
				owned={owned}
			/>
		</div>
	);
}
