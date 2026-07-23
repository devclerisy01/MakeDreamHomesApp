import { IonIcon } from "@ionic/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
	icon: string;
	message: string;
	/** Optional secondary line under the message (mirrors the web's
	 *  title + description empty state, e.g. common.noResultsText). */
	description?: string;
	action?: ReactNode;
}

/** Centered empty/error placeholder for list and detail screens. */
export function EmptyState({
	icon,
	message,
	description,
	action,
}: EmptyStateProps) {
	return (
		<div className="px-6 py-12 text-center text-muted-light">
			<IonIcon icon={icon} className="mb-2.5 text-[40px] text-line" />
			<p className={`m-0 text-sm ${description ? "" : "mb-3"}`}>{message}</p>
			{description ? (
				<p className="mx-auto mb-3 mt-1 max-w-xs text-xs opacity-80">
					{description}
				</p>
			) : null}
			{action}
		</div>
	);
}
