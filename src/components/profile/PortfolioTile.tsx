import { IonIcon } from "@ionic/react";
import { createOutline, trashOutline } from "ionicons/icons";

import { getImageSrc } from "@/lib/format";
import { ICONS } from "@/theme/icons";
import type { PortfolioItem } from "@/types";

/**
 * Portfolio tile with the title + city overlaid on the image (profile grid),
 * matching the design — distinct from the caption-below `PortfolioCard`. On the
 * owner's profile it shows edit + delete actions.
 */
export function PortfolioTile({
	item,
	pending = false,
	photoCount = 0,
	onEdit,
	onDelete,
	onOpen,
}: {
	item: PortfolioItem;
	/** Badge the tile when the entry is still awaiting moderation. */
	pending?: boolean;
	/** Total photos in the entry — shows a "+N" badge for the extras beyond the cover. */
	photoCount?: number;
	/** Owner-only: open the edit sheet for this entry. */
	onEdit?: () => void;
	/** Owner-only: delete this entry (with confirm). */
	onDelete?: () => void;
	/** Open this image in the fullscreen lightbox. */
	onOpen?: () => void;
}) {
	const src = getImageSrc(item);
	const place = item.city || item.location;
	const extra = photoCount > 1 ? photoCount - 1 : 0;
	return (
		<div
			className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-muted ${
				onOpen ? "cursor-pointer" : ""
			}`}
			onClick={onOpen}
		>
			{src ? (
				<img
					src={src}
					alt={item.title ?? "Portfolio image"}
					loading="lazy"
					className="h-full w-full object-cover"
				/>
			) : null}
			{pending ? (
				<span className="absolute left-2 top-2 rounded-md bg-amber-400/95 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-ink">
					Pending
				</span>
			) : null}
			{onEdit || onDelete ? (
				<div className="absolute right-2 top-2 flex gap-1.5">
					{onEdit ? (
						<button
							type="button"
							aria-label="Edit project"
							onClick={(event) => {
								event.stopPropagation();
								onEdit();
							}}
							className="grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur active:bg-black/75"
						>
							<IonIcon icon={createOutline} className="text-[15px]" />
						</button>
					) : null}
					{onDelete ? (
						<button
							type="button"
							aria-label="Delete project"
							onClick={(event) => {
								event.stopPropagation();
								onDelete();
							}}
							className="grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur active:bg-black/75"
						>
							<IonIcon icon={trashOutline} className="text-[15px]" />
						</button>
					) : null}
				</div>
			) : null}
			{extra > 0 ? (
				<span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
					<IonIcon icon={ICONS.image} className="text-[11px]" />+{extra}
				</span>
			) : null}
			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/100 via-black/30 to-transparent px-3 pb-3 pt-10">
				{item.title ? (
					<h4 className="m-0 line-clamp-1 text-sm font-bold text-white">
						{item.title}
					</h4>
				) : null}
				{place ? (
					<span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-white/85">
						<IonIcon icon={ICONS.location} className="text-sm" />
						{place}
					</span>
				) : null}
			</div>
		</div>
	);
}
