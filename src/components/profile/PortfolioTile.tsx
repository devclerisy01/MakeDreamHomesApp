import { IonIcon } from "@ionic/react";
import { locationOutline } from "ionicons/icons";

import { getImageSrc } from "@/lib/format";
import type { PortfolioItem } from "@/types";

/**
 * Portfolio tile with the title + city overlaid on the image (profile grid),
 * matching the design — distinct from the caption-below `PortfolioCard`.
 */
export function PortfolioTile({
	item,
	pending = false,
}: {
	item: PortfolioItem;
	/** Badge the tile when the entry is still awaiting moderation. */
	pending?: boolean;
}) {
	const src = getImageSrc(item);
	const place = item.city || item.location;
	return (
		<div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-muted">
			{src ? (
				<img
					src={src}
					alt={item.title}
					loading="lazy"
					className="h-full w-full object-cover"
				/>
			) : null}
			{pending ? (
				<span className="absolute right-2 top-2 rounded-md bg-amber-400/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
					Pending
				</span>
			) : null}
			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-3 pt-10">
				<h4 className="m-0 line-clamp-1 text-sm font-bold text-white">
					{item.title}
				</h4>
				{place ? (
					<span className="mt-0.5 flex items-center gap-1 text-[11px] text-white/85">
						<IonIcon icon={locationOutline} className="text-xs" />
						{place}
					</span>
				) : null}
			</div>
		</div>
	);
}
