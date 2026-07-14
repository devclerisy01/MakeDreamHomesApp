import { IonIcon } from "@ionic/react";
import {
	cubeOutline,
	homeOutline,
	locationOutline,
	people,
	walletOutline,
} from "ionicons/icons";

import { SaveButton } from "@/components/common/SaveButton";
import { leadBaseCategory, leadIntent } from "@/lib/api/leads";
import { formatBudget, timeAgo } from "@/lib/format";
import { CARD, META, TAG_MUTED } from "@/lib/ui";
import type { Lead, LeadCategoryId } from "@/types";

const CATEGORY_ICON: Record<LeadCategoryId, string> = {
	property: homeOutline,
	material: cubeOutline,
	professional: people,
};

export function LeadCard({
	lead,
	onSaveToggle,
	owned = false,
}: {
	lead: Lead;
	onSaveToggle?: (saved: boolean) => void;
	/** The signed-in user's own lead — hides the save heart. */
	owned?: boolean;
}) {
	const intent = leadIntent(lead.category);
	const icon = CATEGORY_ICON[leadBaseCategory(lead.category)];
	const title = lead.summary?.trim() || lead.description;
	const budget = formatBudget(lead.budget);
	const tags = (lead.tags ?? []).slice(0, 3);
	const posted = timeAgo(lead.createdAt);

	return (
		<div className={`p-3.5 ${CARD}`}>
			<div className="flex gap-3">
				<div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-line bg-surface-muted">
					<IonIcon icon={icon} className="text-2xl text-primary" />
					{intent ? (
						<span
							className={`absolute -bottom-1.5 left-1 rounded-[5px] px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white ${
								intent === "buy" ? "bg-primary" : "bg-sky-500"
							}`}
						>
							{intent.toUpperCase()}
						</span>
					) : null}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<h3 className="m-0 line-clamp-2 text-[15px] font-bold leading-snug text-ink">
							{title}
						</h3>
						{owned ? null : (
							<SaveButton
								entityType="leads"
								entityId={lead.id}
								onToggle={onSaveToggle}
							/>
						)}
					</div>
					<div className="mt-2 flex flex-wrap items-center gap-1.5">
						{tags.map((tag) => (
							<span key={tag} className={TAG_MUTED}>
								{tag}
							</span>
						))}
						{posted ? (
							<span className="ml-auto whitespace-nowrap text-xs text-muted-light">
								{posted}
							</span>
						) : null}
					</div>
				</div>
			</div>

			<div className="mt-3 flex items-center justify-between gap-2.5 border-t border-line pt-3">
				{lead.location ? (
					<span className={META}>
						<IonIcon icon={locationOutline} className="shrink-0 text-[15px]" />
						<span className="truncate">{lead.location}</span>
					</span>
				) : (
					<span />
				)}
				{budget ? (
					<span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-bold text-ink">
						<IonIcon
							icon={walletOutline}
							className="text-[15px] text-muted-light"
						/>
						Est. Price: {budget}
					</span>
				) : null}
			</div>
		</div>
	);
}
