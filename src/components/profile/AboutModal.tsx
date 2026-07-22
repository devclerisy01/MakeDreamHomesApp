import { IonModal } from "@ionic/react";
import { useEffect, useState } from "react";

import { VoiceTextarea } from "@/components/common/VoiceTextarea";
import { type AuthUser, updateProfile } from "@/lib/api/auth";
import { setStoredUser } from "@/lib/auth/session";

interface AboutModalProps {
	isOpen: boolean;
	/** Current About text (seeds the field on open). */
	about: string;
	onClose: () => void;
	onSaved: (user: AuthUser) => void;
}

const MIN_LENGTH = 20;

/**
 * About-only editor (P32) for the profile hero — a single focused field with
 * voice dictation, kept separate from the section-based EditProfileModal. Blank
 * clears the About; otherwise at least 20 characters are required so the bio is
 * substantive enough to display. Saves via `PATCH /app/auth/me` and pushes the
 * fresh user back (the hero repaints live via the reactive session store).
 */
export function AboutModal({
	isOpen,
	about,
	onClose,
	onSaved,
}: AboutModalProps) {
	const [value, setValue] = useState(about);
	const [saving, setSaving] = useState(false);
	// Gates the inline error so we don't nag while the user is still typing — it
	// flips true the first time Save is pressed with a too-short value.
	const [submitAttempted, setSubmitAttempted] = useState(false);

	// Re-seed from the current About every time the sheet opens.
	useEffect(() => {
		if (!isOpen) return;
		setValue(about);
		setSubmitAttempted(false);
	}, [isOpen, about]);

	// Allow blank (clears the field); otherwise require at least 20 characters.
	const trimmed = value.trim();
	const tooShort = trimmed.length > 0 && trimmed.length < MIN_LENGTH;
	const showError = submitAttempted && tooShort;

	async function save() {
		if (saving) return;
		if (tooShort) {
			setSubmitAttempted(true);
			return;
		}
		setSaving(true);
		try {
			const updated = await updateProfile({ about: trimmed });
			setStoredUser(updated);
			onSaved(updated);
			onClose();
		} catch {
			// Failures are toasted centrally; keep the sheet open to retry.
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
					<h2 className="m-0 text-base font-extrabold text-ink">About</h2>
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
					<div className="mx-auto flex w-full max-w-[460px] flex-col gap-1.5">
						<span className="mb-1 block text-sm font-semibold text-ink">
							Tell people about yourself or your business
						</span>
						<VoiceTextarea
							id="about-modal-text"
							value={value}
							onValueChange={setValue}
							rows={7}
							placeholder="Describe your work, experience and what makes you stand out."
							ariaLabel="About"
							error={showError}
						/>
						{showError ? (
							<p className="m-0 text-[13px] text-danger">
								Please describe your work in at least {MIN_LENGTH} characters.
							</p>
						) : null}
					</div>
				</div>
			</div>
		</IonModal>
	);
}
