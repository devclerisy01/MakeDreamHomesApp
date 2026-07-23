import { IonIcon } from "@ionic/react";
import { type MouseEvent, useState } from "react";

import type { SupplierCategoryCard } from "@/lib/supplier-categories";
import { ICONS } from "@/theme/icons";

/** Stop a chip tap from bubbling to the card's detail link. */
function stop(event: MouseEvent) {
	event.preventDefault();
	event.stopPropagation();
}

/**
 * Supplier "Categories" block. Each category is a chip carrying an
 * authorized-dealer shield when the supplier is authorized for any brand in it.
 *
 * When `showBrands` is set (e.g. the detail page), tapping a chip with brands
 * expands its brand list inline (mirrors the web's hover popover). On listing
 * cards `showBrands` is off — chips are plain, and brands are shown only on the
 * details page.
 */
export function SupplierCategories({
	categories,
	className,
	showBrands = false,
}: {
	categories: SupplierCategoryCard[];
	className?: string;
	/** Allow tapping a chip to reveal its brands. Off on cards. */
	showBrands?: boolean;
}) {
	const [openName, setOpenName] = useState<string | null>(null);
	if (!categories.length) return null;

	const openCat = showBrands
		? (categories.find((c) => c.name === openName) ?? null)
		: null;

	return (
		<div className={className}>
			<p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-muted">
				Categories
			</p>
			<div className="flex flex-wrap gap-1.5">
				{categories.map((cat) => {
					const isAuthorized = cat.authorizedBrands.length > 0;
					const canExpand = showBrands && cat.brands.length > 0;
					const isOpen = openName === cat.name;
					const chipCls = `inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-ink transition-colors ${
						isOpen ? "bg-primary-light" : "bg-surface-muted"
					}`;
					const shield = isAuthorized ? (
						<IonIcon
							icon={ICONS.shieldCheck}
							className="shrink-0 text-[12px] text-[#16A34A]"
						/>
					) : null;

					// Non-expandable chips are plain spans so a tap falls through to the
					// card's detail link instead of being swallowed.
					if (!canExpand) {
						return (
							<span key={cat.name} className={chipCls}>
								{shield}
								{cat.name}
							</span>
						);
					}
					return (
						<button
							key={cat.name}
							type="button"
							onClick={(event) => {
								stop(event);
								setOpenName(isOpen ? null : cat.name);
							}}
							className={chipCls}
						>
							{shield}
							{cat.name}
							<IonIcon
								icon={ICONS.chevronDown}
								className={`text-[9px] text-muted-light transition-transform ${
									isOpen ? "rotate-180" : ""
								}`}
							/>
						</button>
					);
				})}
			</div>

			{/* Brands for the open category — inline so it can't be clipped. */}
			{openCat && openCat.brands.length ? (
				<div
					onClick={stop}
					className="mt-1.5 overflow-hidden rounded-lg border border-line bg-white"
				>
					<div className="flex items-center justify-between gap-2 border-b border-line bg-surface-muted/70 px-2.5 py-1.5">
						<span className="truncate text-[9px] font-extrabold uppercase tracking-wider text-ink">
							{openCat.name} · Brands
						</span>
						<span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
							{openCat.brands.length}
						</span>
					</div>
					<div className="flex max-h-40 flex-col overflow-y-auto py-1">
						{openCat.brands.map((name) => {
							const auth = openCat.authorizedBrands.includes(name);
							return (
								<span
									key={name}
									className="flex items-center gap-2 px-2.5 py-1 text-[11px] font-semibold text-ink"
								>
									{auth ? (
										<IonIcon
											icon={ICONS.shieldCheck}
											className="shrink-0 text-[12px] text-[#16A34A]"
										/>
									) : (
										<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
									)}
									<span className="min-w-0 flex-1 truncate">{name}</span>
								</span>
							);
						})}
					</div>
				</div>
			) : null}
		</div>
	);
}
