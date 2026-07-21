import { IonIcon } from "@ionic/react";
import { createOutline } from "ionicons/icons";
import { useState } from "react";

import { LeadDetailsModal } from "@/components/cards/LeadDetailsModal";
import {
	leadBaseCategory,
	leadIntentChip,
	leadStatusLabel,
} from "@/lib/api/leads";
import { formatBudget, timeAgo } from "@/lib/format";
import { CARD } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type { Lead, LeadCategoryId } from "@/types";

const CATEGORY_ICON: Record<LeadCategoryId, string> = {
	property: ICONS.categoryProperty,
	material: ICONS.categoryMaterial,
	professional: ICONS.categoryProfessional,
};

/** Subtle status-pill colouring, keyed by the raw LeadStatus enum value. */
const STATUS_CLASS: Record<string, string> = {
	PENDING: "bg-amber-100 text-amber-700",
	IN_PROCESS: "bg-blue-100 text-blue-700",
	COMPLETED: "bg-green-100 text-green-700",
	NOT_INTERESTED: "bg-slate-100 text-slate-600",
	SPAM: "bg-red-100 text-red-700",
	LOST: "bg-slate-100 text-slate-600",
};

/**
 * The signed-in user's own lead, styled to match the public {@link LeadCard}
 * (category icon tile with a BUY/SELL badge, title, tags, and a divider row with
 * location + estimated price) — plus an owner edit affordance. Tapping the card
 * opens the full-detail popup.
 */
export function MyLeadCard({
	lead,
	onEdit,
}: {
	lead: Lead;
	onEdit?: () => void;
}) {
	const intent = leadIntentChip(lead.category);
	const intentColor =
		intent === "Buy"
			? "border-blue-200 text-blue-600"
			: "border-rose-200 text-rose-600";
	const icon = CATEGORY_ICON[leadBaseCategory(lead.category)];
	const title = lead.description?.trim() || lead.summary?.trim() || "";
	const budget = formatBudget(lead.budget);
	const allTags = lead.tags ?? [];
	const tags = allTags.slice(0, 5);
	const extraTags = allTags.length - tags.length;
	const posted = timeAgo(lead.createdAt);
	const localityLabel = lead.localities?.length
		? lead.localities.join(" | ")
		: lead.location;

	const [detailsOpen, setDetailsOpen] = useState(false);

	return (
		<>
			<div
				className={`cursor-pointer p-3 ${CARD}`}
				onClick={() => setDetailsOpen(true)}
			>
				<div className="flex gap-3">
					<div className="relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-md bg-[#f2f4f7]">
						<IonIcon icon={icon} className="text-[21px] text-[#14181f]" />
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
							<div className="flex shrink-0 items-center gap-1.5">
								{lead.status ? (
									<span
										className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold ${
											STATUS_CLASS[lead.status] ?? "bg-slate-100 text-slate-600"
										}`}
									>
										{leadStatusLabel(lead.status)}
									</span>
								) : null}
								{onEdit ? (
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											onEdit();
										}}
										aria-label="Edit requirement"
										className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-white text-muted-light active:bg-surface-muted"
									>
										<IonIcon icon={createOutline} className="text-[15px]" />
									</button>
								) : null}
							</div>
						</div>
						<div className="mt-2 flex flex-wrap items-center gap-1.5">
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

				<div className="mt-2.5 flex items-center justify-between gap-2.5 border-t border-line pt-2.5">
					{localityLabel ? (
						<span className="inline-flex min-w-0 items-center gap-1 text-[10px] text-[#6f7791]">
							<IonIcon icon={ICONS.location} className="shrink-0 text-[12px]" />
							<span className="truncate">{localityLabel}</span>
						</span>
					) : (
						<span />
					)}
					{budget ? (
						<span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[10px] text-ink">
							<IonIcon
								icon={ICONS.budget}
								className="text-[12px] text-muted-light"
							/>
							Budget: <span className="font-bold">{budget}</span>
						</span>
					) : null}
				</div>
			</div>

			<LeadDetailsModal
				lead={lead}
				isOpen={detailsOpen}
				onClose={() => setDetailsOpen(false)}
				owned
			/>
		</>
	);
}
