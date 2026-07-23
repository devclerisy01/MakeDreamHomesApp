import { IonIcon } from "@ionic/react";
import { locationOutline, timeOutline, walletOutline } from "ionicons/icons";
import { useState } from "react";

import { BoxModal } from "@/components/common/BoxModal";
import { Lightbox } from "@/components/common/Lightbox";
import { SaveButton } from "@/components/common/SaveButton";
import { assetUrl } from "@/lib/asset";
import { useAuth } from "@/lib/auth/session";
import { useStartChat } from "@/lib/chat/use-start-chat";
import { formatBudget, timeAgo } from "@/lib/format";
import { TAG_MUTED } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
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
	const { user } = useAuth();
	const { startChat, busy: chatBusy } = useStartChat();
	const budget = formatBudget(lead.budget);
	const posted = timeAgo(lead.createdAt);
	// All preferred localities joined; fall back to the flat location.
	const localityLabel = lead.localities?.length
		? lead.localities.join(" | ")
		: lead.location;
	// Can message the poster when the lead is tied to a user that isn't the
	// viewer, and it isn't the viewer's own lead. (Logged-out → login prompt.)
	const canMessage =
		!owned && !!lead.userId && String(lead.userId) !== String(user?.id ?? "");
	// Always show the full requirement description in the body. Only skip it when
	// it's identical to the heading (i.e. there was no separate summary).
	const fullDescription = lead.description?.trim();

	const images = (lead.images ?? [])
		.map((src) => assetUrl(src))
		.filter((src): src is string => Boolean(src));
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
						Est. Price: {budget}
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
							<button
								key={i}
								type="button"
								onClick={() => setLightboxIndex(i)}
								className="h-20 w-20 overflow-hidden rounded-xl border border-line"
							>
								<img
									src={src}
									alt=""
									loading="lazy"
									className="h-full w-full object-cover"
								/>
							</button>
						))}
					</div>
				) : null}

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
					<div className="flex flex-col gap-1.5 text-[13px] text-muted-light">
						{localityLabel ? (
							<span className="inline-flex items-center gap-1.5">
								<IonIcon icon={locationOutline} className="text-[15px]" />
								{localityLabel}
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

				{canMessage ? (
					<button
						type="button"
						onClick={() => startChat(lead.userId as string, lead.id)}
						disabled={chatBusy}
						className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-[14px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
					>
						<IonIcon icon={ICONS.message} className="text-[17px]" />
						Send Message
					</button>
				) : null}
			</div>

			{lightboxIndex !== null ? (
				<Lightbox
					images={images.map((src) => ({ src }))}
					index={lightboxIndex}
					onIndexChange={setLightboxIndex}
					onClose={() => setLightboxIndex(null)}
				/>
			) : null}
		</BoxModal>
	);
}
