import { IonIcon } from "@ionic/react";

import { ICONS } from "@/theme/icons";
import type { ProfessionalListing } from "@/types";

const BADGE =
	"inline-flex items-center gap-1 rounded-[4px] border border-success/30 bg-success/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-none text-success";

const cx = (...parts: (string | undefined)[]) =>
	parts.filter(Boolean).join(" ");

/**
 * Compact trust badge for a directory/detail card (mobile — no hover tooltip):
 * suppliers who carry authorized-dealer brands get an "Authorized" badge; RERA
 * dealers get a "RERA" badge. Returns null for every other case. Mirrors the
 * web `ListingBadge` (which shows the same as a hover tooltip on desktop).
 */
export function ListingBadge({
	item,
	className,
}: {
	item: Pick<
		ProfessionalListing,
		"category" | "authorizedBrands" | "isReraCertified"
	>;
	/** Extra classes — e.g. to absolutely position the badge over an avatar. */
	className?: string;
}) {
	if (item.category === "material-suppliers" && item.authorizedBrands?.length) {
		return (
			<span className={cx(BADGE, className)}>
				<IonIcon icon={ICONS.check} className="text-[10px]" />
				Authorized
			</span>
		);
	}
	if (item.category === "property-dealers" && item.isReraCertified) {
		return (
			<span className={cx(BADGE, className)}>
				<IonIcon icon={ICONS.check} className="text-[10px]" />
				RERA
			</span>
		);
	}
	return null;
}
