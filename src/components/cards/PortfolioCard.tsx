import { IonIcon } from "@ionic/react";
import { locationOutline } from "ionicons/icons";

import { getImageSrc } from "@/lib/format";
import { CARD, META } from "@/lib/ui";
import { ICONS } from "@/theme/icons";
import type { PortfolioItem } from "@/types";

export function PortfolioCard({
	item,
	onOpen,
	loading = false,
	isProduct = false,
}: {
	item: PortfolioItem;
	/** Open the item's image gallery (cover becomes tappable when set + has an image). */
	onOpen?: () => void;
	/** Show a spinner over the cover while the gallery images are fetched. */
	loading?: boolean;
	/** Supplier product: show brand chips instead of a location line. */
	isProduct?: boolean;
}) {
	const src = getImageSrc(item);
	const hasImage = !!src;
	// "+N" counts the images beyond the cover (supplier products carry them inline).
	const extraCount = item.images?.length ? item.images.length - 1 : 0;
	const showLocation = !isProduct && !!(item.city ?? item.location);
	const authorizedSet = new Set(item.authorizedBrands ?? []);
	const brands = item.brands ?? [];
	const clickable = !!onOpen && hasImage;

	const cover = (
		<div className="relative grid aspect-[16/10] place-items-center bg-surface-muted">
			{src ? (
				<img
					src={src}
					alt={item.title ?? "Portfolio image"}
					loading="lazy"
					className="h-full w-full object-cover"
				/>
			) : (
				<IonIcon
					icon={ICONS.image}
					className="text-[32px] text-muted-light/60"
					aria-hidden
				/>
			)}
			{extraCount > 0 ? (
				<span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
					<IonIcon icon={ICONS.image} className="text-[11px]" />+{extraCount}
				</span>
			) : null}
			{loading ? (
				<span className="absolute inset-0 grid place-items-center bg-black/25">
					<span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
				</span>
			) : null}
		</div>
	);

	return (
		<div className={`overflow-hidden ${CARD}`}>
			{clickable ? (
				<button
					type="button"
					onClick={onOpen}
					aria-label={`View ${item.title ?? "images"}`}
					className="block w-full"
				>
					{cover}
				</button>
			) : (
				cover
			)}
			<div className="px-3 py-2.5">
				{item.title ? (
					<h4 className="m-0 line-clamp-2 text-[13px] font-bold leading-snug text-ink">
						{item.title}
					</h4>
				) : null}
				{showLocation ? (
					<span className={`mt-[3px] ${META}`}>
						<IonIcon icon={locationOutline} className="shrink-0 text-[15px]" />
						{item.city ?? item.location}
					</span>
				) : null}
				{brands.length ? (
					<div className="mt-2 flex flex-wrap gap-1">
						{brands.map((brand) => {
							const authorized = authorizedSet.has(brand);
							return (
								<span
									key={brand}
									className={`inline-flex items-center gap-0.5 rounded-[4px] border px-1.5 py-0.5 text-[9px] font-semibold ${
										authorized
											? "border-success/30 bg-success/10 text-success"
											: "border-line bg-surface-muted text-muted"
									}`}
								>
									{authorized ? (
										<IonIcon icon={ICONS.check} className="text-[10px]" />
									) : null}
									{brand}
								</span>
							);
						})}
					</div>
				) : null}
			</div>
		</div>
	);
}
