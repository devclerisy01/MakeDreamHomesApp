import { IonModal } from "@ionic/react";
import { useEffect, useState } from "react";

import { TextField } from "@/components/common/TextField";
import { updateLead } from "@/lib/api/leads";
import type { Lead } from "@/types";

interface EditLeadModalProps {
	lead: Lead | null;
	isOpen: boolean;
	onClose: () => void;
	/** Called with the locally-patched lead so the list updates in place. */
	onSaved: (updated: Lead) => void;
}

/**
 * Edit-requirement bottom sheet opened from a My-Leads card's pencil (P24).
 * Edits the description, location and estimated price in place via
 * `PATCH /app/leads/:id`; on success it hands the parent a locally-patched lead.
 */
export function EditLeadModal({
	lead,
	isOpen,
	onClose,
	onSaved,
}: EditLeadModalProps) {
	const [description, setDescription] = useState("");
	const [location, setLocation] = useState("");
	const [price, setPrice] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// Re-seed from the lead each time the sheet opens.
	useEffect(() => {
		if (isOpen && lead) {
			setDescription(lead.description ?? "");
			setLocation(lead.location ?? "");
			// budget may arrive formatted (e.g. "₹2.75 L"); strip to digits for editing.
			setPrice(String(lead.budget ?? "").replace(/[^\d.]/g, ""));
			setError(null);
		}
	}, [isOpen, lead]);

	async function save() {
		if (saving || !lead) return;
		const desc = description.trim();
		if (desc.length < 20) {
			setError("Please describe your requirement in at least 20 characters.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await updateLead(lead.id, {
				description: desc,
				address: location,
				price,
			});
			// Success is toasted centrally; patch the lead locally for the list.
			onSaved({
				...lead,
				description: desc,
				location: location.trim() || lead.location,
				budget: price.trim() || null,
			});
			onClose();
		} catch {
			setError("Couldn't save changes. Please try again.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			initialBreakpoint={1}
			breakpoints={[0, 1]}
		>
			<div className="flex h-full flex-col bg-surface-muted">
				<div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
					<button
						type="button"
						onClick={onClose}
						className="text-sm font-semibold text-muted"
					>
						Cancel
					</button>
					<h2 className="m-0 text-base font-extrabold text-ink">
						Edit requirement
					</h2>
					<button
						type="button"
						onClick={save}
						disabled={saving}
						className="text-sm font-bold text-primary disabled:opacity-50"
					>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-4 py-5">
					<div className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-semibold text-ink">
								Requirement
							</span>
							<TextField
								value={description}
								onChange={setDescription}
								placeholder="Describe what you need — quantity, materials, timeline, etc."
								multiline
								rows={4}
							/>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-semibold text-ink">Location</span>
							<TextField
								value={location}
								onChange={setLocation}
								placeholder="Area, city"
							/>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-semibold text-ink">
								Estimated Price (₹)
							</span>
							<TextField
								value={price}
								onChange={(next) => setPrice(next.replace(/[^\d.]/g, ""))}
								placeholder="e.g. 500000"
								inputMode="numeric"
							/>
						</label>
						{error ? (
							<p className="m-0 text-[13px] text-danger">{error}</p>
						) : null}
					</div>
				</div>
			</div>
		</IonModal>
	);
}
