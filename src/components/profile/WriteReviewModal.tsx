import { IonIcon, IonModal } from "@ionic/react";
import { star, starOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";

import { TextField } from "@/components/common/TextField";
import { UI_MESSAGES } from "@/constants/messages";
import {
	REVIEW_SUB_CATEGORIES,
	type ReviewCategoryKey,
} from "@/constants/reviews";
import { submitReview } from "@/lib/api/reviews";
import { toastError } from "@/lib/api/toast";
import { ICONS } from "@/theme/icons";

interface WriteReviewModalProps {
	/** Target user's id (the one being reviewed). */
	reviewForId: string;
	name: string;
	isOpen: boolean;
	onClose: () => void;
	/** Called after a successful submit (e.g. to hide the trigger + refetch). */
	onSubmitted: () => void;
}

type Ratings = Record<ReviewCategoryKey, number>;

const EMPTY: Ratings = {
	quality: 0,
	behaviour: 0,
	timeliness: 0,
	communication: 0,
	price: 0,
};

/** Max characters accepted in the optional comment (matches the web form). */
const COMMENT_MAX = 1000;

/**
 * Collects the five category star ratings + an optional comment and submits a
 * review (`POST /app/reviews`). Success/error messages toast centrally; the
 * sheet closes on success and stays open (to retry) on failure. Mirrors the
 * web's review form.
 */
export function WriteReviewModal({
	reviewForId,
	name,
	isOpen,
	onClose,
	onSubmitted,
}: WriteReviewModalProps) {
	const translate = useTranslations();
	const [ratings, setRatings] = useState<Ratings>(EMPTY);
	const [comment, setComment] = useState("");
	const [saving, setSaving] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setRatings(EMPTY);
			setComment("");
			setSubmitted(false);
		}
	}, [isOpen]);

	async function save() {
		if (saving) return;
		if (REVIEW_SUB_CATEGORIES.some((c) => ratings[c.key] < 1)) {
			toastError(UI_MESSAGES.rateEveryCategory);
			return;
		}
		if (comment.trim() && comment.trim().length < 20) {
			toastError(UI_MESSAGES.commentTooShort);
			return;
		}
		setSaving(true);
		try {
			await submitReview({
				reviewForId,
				quality: ratings.quality,
				behaviour: ratings.behaviour,
				timeliness: ratings.timeliness,
				communication: ratings.communication,
				price: ratings.price,
				...(comment.trim() ? { comment: comment.trim() } : {}),
			});
			// Success is toasted centrally (reviews.submitted); also show the
			// in-modal pending-approval screen and let the parent hide the trigger.
			onSubmitted();
			setSubmitted(true);
		} catch {
			// Errors (e.g. already reviewed) are toasted centrally; keep open.
		} finally {
			setSaving(false);
		}
	}

	if (submitted) {
		return (
			<IonModal isOpen={isOpen} onDidDismiss={onClose}>
				<div className="flex h-full flex-col bg-surface-muted">
					<div className="flex items-center justify-end border-b border-line bg-white px-4 py-3">
						<button
							type="button"
							onClick={onClose}
							className="text-sm font-bold text-primary"
						>
							{translate("mobile.common.done")}
						</button>
					</div>
					<div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
						<span className="grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
							<IonIcon icon={ICONS.check} className="text-[34px]" />
						</span>
						<div>
							<h3 className="m-0 text-lg font-extrabold text-ink">
								{translate("professional.reviewSuccessTitle")}
							</h3>
							<p className="mx-auto mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-muted-light">
								{translate("professional.reviewSuccessText")}{" "}
								{translate("professional.reviewPendingNote")}
							</p>
						</div>
					</div>
				</div>
			</IonModal>
		);
	}

	return (
		<IonModal isOpen={isOpen} onDidDismiss={onClose}>
			<div className="flex h-full flex-col bg-surface-muted">
				<div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
					<button
						type="button"
						onClick={onClose}
						className="text-sm font-semibold text-muted"
					>
						{translate("common.cancel")}
					</button>
					<h2 className="m-0 text-base font-extrabold text-ink">
						{translate("professional.reviewModalTitle")}
					</h2>
					<button
						type="button"
						onClick={save}
						disabled={saving}
						className="text-sm font-bold text-primary disabled:opacity-50"
					>
						{saving
							? translate("messages.status.sending")
							: translate("professional.reviewSubmit")}
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-4 py-5">
					<div className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
						<p className="m-0 text-sm text-muted">
							{translate("mobile.review.intro", { name })}
						</p>

						{REVIEW_SUB_CATEGORIES.map((cat) => (
							<div
								key={cat.key}
								className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-3.5 py-3"
							>
								<span className="flex min-w-0 flex-col">
									<span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
										<span className="text-base">{cat.icon}</span>
										{translate(cat.labelKey)}
									</span>
									<span className="mt-0.5 text-[11px] leading-snug text-muted-light">
										{translate(cat.descKey)}
									</span>
								</span>
								<div className="flex shrink-0 gap-1">
									{[1, 2, 3, 4, 5].map((value) => (
										<button
											key={value}
											type="button"
											aria-label={`${translate(cat.labelKey)}: ${value} star`}
											onClick={() =>
												setRatings((prev) => ({ ...prev, [cat.key]: value }))
											}
										>
											<IonIcon
												icon={ratings[cat.key] >= value ? star : starOutline}
												className="text-xl text-amber-400"
											/>
										</button>
									))}
								</div>
							</div>
						))}

						<div>
							<div className="mb-1.5 flex items-center justify-between gap-2">
								<span className="text-sm font-semibold text-ink">
									{translate("professional.reviewCommentLabel")}
								</span>
								<span className="text-[11px] font-medium text-muted-light">
									{comment.length}/{COMMENT_MAX}
								</span>
							</div>
							<TextField
								value={comment}
								onChange={(next) => setComment(next.slice(0, COMMENT_MAX))}
								placeholder={translate("professional.reviewCommentPlaceholder")}
								multiline
								rows={4}
							/>
						</div>
					</div>
				</div>
			</div>
		</IonModal>
	);
}
