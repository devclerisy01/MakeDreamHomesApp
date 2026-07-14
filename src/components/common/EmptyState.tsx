import { IonIcon } from "@ionic/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
	icon: string;
	message: string;
	action?: ReactNode;
}

/** Centered empty/error placeholder for list and detail screens. */
export function EmptyState({ icon, message, action }: EmptyStateProps) {
	return (
		<div className="px-6 py-12 text-center text-muted-light">
			<IonIcon icon={icon} className="mb-2.5 text-[40px] text-line" />
			<p className="m-0 mb-3 text-sm">{message}</p>
			{action}
		</div>
	);
}
