import { IonIcon, IonRouterLink } from "@ionic/react";

import { ICONS } from "@/theme/icons";

/**
 * "View All →" section link. The label + arrow live inside an inner <span> so
 * the flex layout applies to exactly those two children — `IonRouterLink`
 * renders a shadow-DOM <a>/<slot>, and putting flex on the host would make that
 * <a> a phantom flex child that skews the gap and vertical alignment.
 */
export function ViewAllLink({ routerLink }: { routerLink: string }) {
	return (
		<IonRouterLink routerLink={routerLink} className="no-underline">
			<span className="inline-flex items-center gap-1.5 text-[12px] font-medium leading-none text-ink">
				View All
				<IonIcon icon={ICONS.arrowForward} className="text-[13px]" />
			</span>
		</IonRouterLink>
	);
}
