import { IonIcon } from "@ionic/react";

import { ICONS } from "@/theme/icons";
import type { ProfessionalListing } from "@/types";

// White pill with a shadow and dark label, matching the web ListingBadge.
const BADGE =
	"inline-flex items-center gap-1 rounded-md bg-white py-0.5 pl-0.5 pr-1.5 text-[10px] font-bold text-ink shadow-md";

const cx = (...parts: (string | undefined)[]) =>
	parts.filter(Boolean).join(" ");

/**
 * Compact trust badge for a directory/detail card (mobile — no hover tooltip):
 * suppliers who carry authorized-dealer brands get an "Authorized" badge; RERA
 * dealers get a "RERA" badge. Returns null for every other case. Mirrors the
 * web `ListingBadge` — a white pill with a green shield-check glyph.
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
				<IonIcon
					icon={ICONS.shieldCheck}
					className="text-[14px] text-[#16A34A]"
				/>
				Authorized
			</span>
		);
	}
	if (item.category === "property-dealers" && item.isReraCertified) {
		return (
			<span className={cx(BADGE, className)}>
				<IonIcon
					icon={ICONS.shieldCheck}
					className="text-[14px] text-[#16A34A]"
				/>
				RERA
			</span>
		);
	}
	return null;
}
