import { IonIcon, IonModal } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import type { CSSProperties, ReactNode } from "react";

interface BoxModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	/** Muted line under the title. */
	subtitle?: string;
	children: ReactNode;
}

/**
 * Centered dialog "box" (rounded card, dimmed backdrop, title + close + divider,
 * scrollable body) — mirrors the web `Modal`. Used for detail / read-more popups
 * (distinct from the bottom-sheet auth/filter popups).
 */
export function BoxModal({
	isOpen,
	onClose,
	title,
	subtitle,
	children,
}: BoxModalProps) {
	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			style={
				{
					"--width": "min(92%, 520px)",
					"--height": "auto",
					"--max-height": "86vh",
					"--border-radius": "18px",
				} as CSSProperties
			}
		>
			<div className="flex max-h-[86vh] flex-col bg-white">
				<div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5">
					<div className="min-w-0">
						<h2 className="m-0 text-lg font-extrabold text-ink">{title}</h2>
						{subtitle ? (
							<p className="mt-0.5 text-sm text-muted-light">{subtitle}</p>
						) : null}
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink active:bg-surface-muted"
					>
						<IonIcon icon={closeOutline} className="text-xl" />
					</button>
				</div>
				<div className="mt-4 shrink-0 border-t border-line" />
				<div className="min-h-0 overflow-y-auto px-5 pb-5 pt-4">{children}</div>
			</div>
		</IonModal>
	);
}
