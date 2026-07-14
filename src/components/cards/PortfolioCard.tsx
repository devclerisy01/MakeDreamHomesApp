import { IonIcon } from "@ionic/react";
import { locationOutline } from "ionicons/icons";

import { getImageSrc } from "@/lib/format";
import { CARD, META } from "@/lib/ui";
import type { PortfolioItem } from "@/types";

export function PortfolioCard({ item }: { item: PortfolioItem }) {
	const src = getImageSrc(item);
	return (
		<div className={`overflow-hidden ${CARD}`}>
			<div className="aspect-[16/10] bg-surface-muted">
				{src ? (
					<img
						src={src}
						alt={item.title}
						loading="lazy"
						className="h-full w-full object-cover"
					/>
				) : null}
			</div>
			<div className="px-3 py-2.5">
				<h4 className="m-0 line-clamp-2 text-[13.5px] font-bold leading-snug text-ink">
					{item.title}
				</h4>
				{item.city ? (
					<span className={`mt-[3px] ${META}`}>
						<IonIcon icon={locationOutline} className="shrink-0 text-[15px]" />
						{item.city}
					</span>
				) : null}
			</div>
		</div>
	);
}
