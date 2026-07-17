/**
 * Shared Tailwind class tokens — recurring class strings kept in one place so
 * cards/sections stay visually consistent (same spirit as the web frontend's
 * reused utility patterns). Values are literal strings so Tailwind's scanner
 * picks them up.
 */
export const CARD =
	"rounded-[10px] bg-white shadow-[0_1px_2.4px_rgba(0,0,0,0.13)] border border-black/5";

export const TAG =
	"inline-flex items-center whitespace-nowrap rounded-[4px] border px-[7px] py-1 text-[8px] font-medium capitalize leading-none";
/** Muted chip — light-blue fill, matches the Figma lead tags / pro category. */
export const TAG_MUTED = `${TAG} border-[#d7dded] bg-[#f1f4fc] text-[#6f7791]`;
/** Primary chip — light-blue border with primary text color and background. */
export const TAG_PRIMARY = `${TAG} border-primary-light text-primary-dark bg-primary-light/50`;

export const META =
	"inline-flex items-center gap-1 min-w-0 text-[12px] text-ink/80";

export const LIST_GRID = "grid grid-cols-1 gap-3 md:grid-cols-2";

/** Portfolio thumbnails sit two-up even on phones (matches the design). */
export const PORTFOLIO_GRID = "grid grid-cols-2 gap-3.5 md:grid-cols-3";

export const SECTION_HEAD = "flex items-center justify-between mb-2.5";
export const SECTION_TITLE = "m-0 text-[15px] font-bold text-ink";
