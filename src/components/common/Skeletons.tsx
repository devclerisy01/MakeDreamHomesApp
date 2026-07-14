import { CARD, LIST_GRID } from "@/lib/ui";

const BAR = "mdh-shimmer rounded-md";

/** Mirrors ProfessionalCard's layout (image + text column). */
export function ProCardSkeleton() {
	return (
		<div className={`flex items-stretch gap-3 p-3 ${CARD}`}>
			<div className="mdh-shimmer h-[112px] w-[88px] shrink-0 rounded-xl" />
			<div className="flex flex-1 flex-col gap-[9px] pt-1.5">
				<div className={`${BAR} h-3 w-2/5`} />
				<div className={`${BAR} h-4 w-[72%]`} />
				<div className={`${BAR} h-3 w-[55%]`} />
				<div className={`${BAR} h-3 w-[90%]`} />
			</div>
		</div>
	);
}

/** Mirrors LeadCard's layout (icon + title/tags + footer). */
export function LeadCardSkeleton() {
	return (
		<div className={`p-3.5 ${CARD}`}>
			<div className="flex gap-3">
				<div className="mdh-shimmer h-14 w-14 shrink-0 rounded-xl" />
				<div className="flex flex-1 flex-col gap-[9px] pt-1">
					<div className={`${BAR} h-4 w-[95%]`} />
					<div className={`${BAR} h-4 w-[60%]`} />
					<div className={`${BAR} h-3 w-[45%]`} />
				</div>
			</div>
			<div className={`${BAR} mt-3.5 h-3 w-full`} />
		</div>
	);
}

/** Renders `count` skeletons of the given card variant. */
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

/** Header block for the professional detail screen. */
export function DetailSkeleton() {
	return (
		<div className={LIST_GRID}>
			<div className={`flex gap-3 p-3 ${CARD}`}>
				<div className="mdh-shimmer h-[110px] w-[110px] shrink-0 rounded-[14px]" />
				<div className="flex flex-1 flex-col gap-[9px] pt-1.5">
					<div className={`${BAR} h-3 w-[35%]`} />
					<div className={`${BAR} h-4 w-[70%]`} />
					<div className={`${BAR} h-3 w-[55%]`} />
					<div className={`${BAR} h-3 w-[85%]`} />
				</div>
			</div>
		</div>
	);
}
