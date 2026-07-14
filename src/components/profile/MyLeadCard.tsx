import { IonIcon } from "@ionic/react";
import {
	createOutline,
	locationOutline,
	timeOutline,
	walletOutline,
} from "ionicons/icons";

import { formatBudget, timeAgo } from "@/lib/format";
import { CARD, META, TAG_MUTED } from "@/lib/ui";
import type { Lead } from "@/types";

/**
 * The signed-in user's own lead, styled per the profile "My Leads" design:
 * title + edit affordance, location, estimated price, then tags and a
 * "Posted …" timestamp under a divider.
 */
export function MyLeadCard({
	lead,
	onEdit,
}: {
	lead: Lead;
	onEdit?: () => void;
}) {
	const title = lead.summary?.trim() || lead.description;
	const budget = formatBudget(lead.budget);
	const tags = (lead.tags ?? []).slice(0, 3);
	const posted = timeAgo(lead.createdAt);

	return (
		<div className={`p-4 ${CARD}`}>
			<div className="flex items-start justify-between gap-2">
				<h3 className="m-0 line-clamp-3 text-[15px] font-bold leading-snug text-ink">
					{title}
				</h3>
				{onEdit ? (
					<button
						type="button"
						onClick={onEdit}
						aria-label="Edit requirement"
						className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-muted-light active:bg-surface-muted"
					>
						<IonIcon icon={createOutline} />
					</button>
				) : null}
			</div>

			<div className="mt-2.5 flex flex-col gap-1.5">
				{lead.location ? (
					<span className={META}>
						<IonIcon icon={locationOutline} className="shrink-0 text-[15px]" />
						<span className="truncate">{lead.location}</span>
					</span>
				) : null}
				{budget ? (
					<span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
						<IonIcon
							icon={walletOutline}
							className="text-[15px] text-muted-light"
						/>
						Est. Price: {budget}
					</span>
				) : null}
			</div>

			{tags.length || posted ? (
				<div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
					<div className="flex flex-wrap gap-1.5">
						{tags.map((tag) => (
							<span key={tag} className={TAG_MUTED}>
								{tag}
							</span>
						))}
					</div>
					{posted ? (
						<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted-light">
							<IonIcon icon={timeOutline} />
							Posted {posted}
						</span>
					) : null}
				</div>
			) : null}
		</div>
	);
}
