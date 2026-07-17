import { IonIcon } from "@ionic/react";
import { locationOutline, timeOutline, walletOutline } from "ionicons/icons";

import { BoxModal } from "@/components/common/BoxModal";
import { SaveButton } from "@/components/common/SaveButton";
import { assetUrl } from "@/lib/asset";
import { formatBudget, timeAgo } from "@/lib/format";
import { TAG_MUTED } from "@/lib/ui";
import type { Lead } from "@/types";

/**
 * Full-detail popup for a lead — the same content the card shows but fully
 * expanded (no clamp, all tags, image thumbnails). Mirrors the web
 * `LeadDetailsModal`; presented as a centered box.
 */
export function LeadDetailsModal({
	lead,
	isOpen,
	onClose,
	owned = false,
}: {
	lead: Lead;
	isOpen: boolean;
	onClose: () => void;
	owned?: boolean;
}) {
	const budget = formatBudget(lead.budget);
	const posted = timeAgo(lead.createdAt);
	// Always show the full requirement description in the body. Only skip it when
	// it's identical to the heading (i.e. there was no separate summary).
	const fullDescription = lead.description?.trim();

	const images = (lead.images ?? [])
		.map((src) => assetUrl(src))
		.filter((src): src is string => Boolean(src));

	return (
		<BoxModal isOpen={isOpen} onClose={onClose} title="Lead details">
			<div className="flex flex-col gap-4">
				<h3 className="m-0 text-base font-semibold leading-snug text-ink">
					{fullDescription}
				</h3>

				{budget ? (
					<span className="inline-flex items-center gap-2 text-[12px] font-semibold text-ink">
						<IonIcon
							icon={walletOutline}
							className="text-muted-light text-base"
						/>
						Budget: {budget}
					</span>
				) : null}

				{(lead.tags ?? []).length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{(lead.tags ?? []).map((tag, i) => (
							<span key={`${tag}-${i}`} className={TAG_MUTED}>
								{tag}
							</span>
						))}
					</div>
				) : null}

				{images.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{images.map((src, i) => (
							<img
								key={i}
								src={src}
								alt=""
								loading="lazy"
								className="h-20 w-20 rounded-xl border border-line object-cover"
							/>
						))}
					</div>
				) : null}

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
					<div className="flex flex-col gap-1.5 text-[13px] text-muted-light">
						{lead.location ? (
							<span className="inline-flex items-center gap-1.5">
								<IonIcon icon={locationOutline} className="text-[15px]" />
								{lead.location}
							</span>
						) : null}
						{posted ? (
							<span className="inline-flex items-center gap-1.5">
								<IonIcon icon={timeOutline} className="text-[15px]" />
								Posted {posted}
							</span>
						) : null}
					</div>
					{owned ? null : <SaveButton entityType="leads" entityId={lead.id} />}
				</div>
			</div>
		</BoxModal>
	);
}
