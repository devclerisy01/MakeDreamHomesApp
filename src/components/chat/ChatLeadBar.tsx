import { IonIcon } from "@ionic/react";
import { briefcaseOutline } from "ionicons/icons";
import { useState } from "react";

import { LeadDetailsModal } from "@/components/cards/LeadDetailsModal";
import { type ChatLead } from "@/lib/api/chat";
import { getLeadById } from "@/lib/api/leads";
import type { Lead } from "@/types";

/**
 * The lead a conversation is scoped to, shown in the thread header: its title
 * (truncated) + a "More" link that fetches the full lead and opens the shared
 * {@link LeadDetailsModal}. Renders nothing for a general (non-lead) chat.
 * Mirrors the web `ChatLeadBar`.
 */
export function ChatLeadBar({ lead }: { lead: ChatLead | null }) {
	const [open, setOpen] = useState(false);
	const [full, setFull] = useState<Lead | null>(null);
	const [loading, setLoading] = useState(false);

	if (!lead) return null;

	async function openDetails() {
		if (full) {
			setOpen(true);
			return;
		}
		if (loading || !lead) return;
		setLoading(true);
		try {
			setFull(await getLeadById(lead.id));
			setOpen(true);
		} catch {
			/* errors toast centrally */
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<div className="flex min-w-0 items-center gap-1.5">
				<IonIcon
					icon={briefcaseOutline}
					className="shrink-0 text-[13px] text-muted-light"
				/>
				<span
					className="min-w-0 truncate text-[11px] font-semibold text-ink"
					title={lead.title}
				>
					{lead.title}
				</span>
				<button
					type="button"
					onClick={() => void openDetails()}
					disabled={loading}
					className="shrink-0 text-[11px] font-bold text-primary disabled:opacity-50"
				>
					{loading ? "…" : "More"}
				</button>
			</div>

			{full ? (
				<LeadDetailsModal
					lead={full}
					isOpen={open}
					onClose={() => setOpen(false)}
					owned
				/>
			) : null}
		</>
	);
}
