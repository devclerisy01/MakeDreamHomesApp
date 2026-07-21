import { CARD, LIST_GRID, PORTFOLIO_GRID } from "@/lib/ui";

const BAR = "mdh-shimmer rounded-md";

/**
 * Mirrors `ProfessionalCard`: a 93×93 image + a text column (profession/rating
 * row, name, location, active-leads, description + two project thumbs).
 */
export function ProCardSkeleton() {
	return (
		<div className={`flex items-start gap-3 p-3 ${CARD}`}>
			<div className="mdh-shimmer h-[93px] w-[93px] shrink-0 rounded-[5px]" />
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				<div className="flex items-center justify-between gap-2">
					<div className={`${BAR} h-3 w-2/5`} />
					<div className={`${BAR} h-3 w-1/5`} />
				</div>
				<div className={`${BAR} h-3.5 w-3/4`} />
				<div className={`${BAR} h-2.5 w-1/2`} />
				<div className={`${BAR} h-2.5 w-2/5`} />
				<div className="mt-1 flex items-end justify-between gap-2.5">
					<div className={`${BAR} h-2.5 w-3/5`} />
					<div className="flex shrink-0 gap-1">
						<div className="mdh-shimmer h-7 w-8 rounded-[5px]" />
						<div className="mdh-shimmer h-7 w-8 rounded-[5px]" />
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Mirrors `LeadCard`: a 42px icon + title/tags, then a divider footer with the
 * location + budget row.
 */
export function LeadCardSkeleton() {
	return (
		<div className={`p-3 ${CARD}`}>
			<div className="flex gap-3">
				<div className="mdh-shimmer h-[42px] w-[42px] shrink-0 rounded-md" />
				<div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
					<div className={`${BAR} h-3 w-[95%]`} />
					<div className={`${BAR} h-3 w-[55%]`} />
					<div className="mt-1 flex gap-1.5">
						<div className={`${BAR} h-4 w-12`} />
						<div className={`${BAR} h-4 w-14`} />
						<div className={`${BAR} h-4 w-10`} />
					</div>
				</div>
			</div>
			<div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
				<div className={`${BAR} h-2.5 w-2/5`} />
				<div className={`${BAR} h-2.5 w-1/4`} />
			</div>
		</div>
	);
}

/** Renders `count` skeletons of the given card variant in the listing grid. */
export function SkeletonList({
	count,
	variant,
}: {
	count: number;
	variant: "pro" | "lead";
}) {
	return (
		<div className={LIST_GRID}>
			{Array.from({ length: count }, (_, i) =>
				variant === "pro" ? (
					<ProCardSkeleton key={i} />
				) : (
					<LeadCardSkeleton key={i} />
				),
			)}
		</div>
	);
}

/**
 * Mirrors a `ReviewsList` card: an avatar + name/stars header, two comment
 * lines, a time row, and a block of sub-category bars.
 */
export function ReviewCardSkeleton() {
	return (
		<div className={`p-4 ${CARD}`}>
			<div className="flex items-center gap-3">
				<div className="mdh-shimmer h-10 w-10 shrink-0 rounded-full" />
				<div className="flex flex-1 flex-col gap-1.5">
					<div className={`${BAR} h-3 w-1/3`} />
					<div className={`${BAR} h-2.5 w-1/4`} />
				</div>
			</div>
			<div className="mt-3 flex flex-col gap-1.5">
				<div className={`${BAR} h-2.5 w-[92%]`} />
				<div className={`${BAR} h-2.5 w-[70%]`} />
			</div>
			<div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-surface-muted/60 p-2.5">
				{Array.from({ length: 5 }, (_, i) => (
					<div key={i} className="flex items-center gap-2">
						<div className={`${BAR} h-2.5 w-20`} />
						<div className={`${BAR} h-[5px] flex-1`} />
						<div className={`${BAR} h-2.5 w-6`} />
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * A portfolio thumbnail grid skeleton (profile + detail showcase). `className`
 * overrides the grid so it can match the host's exact columns (the profile uses
 * a fixed 2-column grid, the detail showcase uses {@link PORTFOLIO_GRID}).
 */
export function PortfolioGridSkeleton({
	count = 4,
	className = PORTFOLIO_GRID,
}: {
	count?: number;
	className?: string;
}) {
	return (
		<div className={className}>
			{Array.from({ length: count }, (_, i) => (
				<div key={i} className="mdh-shimmer aspect-[4/3] rounded-2xl" />
			))}
		</div>
	);
}

/**
 * Professional-detail screen: the header card, a showcase thumbnail grid and a
 * "Rating & Reviews" block — matching the sections the page renders.
 */
export function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-[22px]">
			<div className={`flex gap-3.5 p-3.5 ${CARD}`}>
				<div className="mdh-shimmer h-[110px] w-[110px] shrink-0 rounded-[14px]" />
				<div className="flex flex-1 flex-col gap-2 pt-1.5">
					<div className={`${BAR} h-3 w-[35%]`} />
					<div className={`${BAR} h-4 w-[70%]`} />
					<div className={`${BAR} h-3 w-[55%]`} />
					<div className={`${BAR} h-3 w-[85%]`} />
					<div className={`${BAR} h-3 w-[72%]`} />
				</div>
			</div>

			<div>
				<div className={`${BAR} mb-2.5 h-4 w-28`} />
				<PortfolioGridSkeleton count={3} />
			</div>

			<div className={`p-4 ${CARD}`}>
				<div className={`${BAR} mb-3.5 h-4 w-40`} />
				<div className="flex flex-col gap-3">
					{Array.from({ length: 5 }, (_, i) => (
						<div key={i} className="flex items-center justify-between">
							<div className={`${BAR} h-3 w-1/3`} />
							<div className={`${BAR} h-3 w-1/5`} />
						</div>
					))}
				</div>
			</div>

			<ReviewCardSkeleton />
		</div>
	);
}
