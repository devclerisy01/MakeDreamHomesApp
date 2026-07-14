/**
 * Shared Tailwind class tokens — recurring class strings kept in one place so
 * cards/sections stay visually consistent (same spirit as the web frontend's
 * reused utility patterns). Values are literal strings so Tailwind's scanner
 * picks them up.
 */
export const CARD = "rounded-2xl bg-white shadow-card border border-black/5";

export const TAG =
	"inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";
export const TAG_PRIMARY = `${TAG} bg-primary-light text-primary-dark`;
export const TAG_MUTED = `${TAG} bg-surface-muted text-muted border border-line`;

export const META =
	"inline-flex items-center gap-1 min-w-0 text-[13px] text-muted-light";

export const LIST_GRID = "grid grid-cols-1 gap-3.5 md:grid-cols-2";

/** Portfolio thumbnails sit two-up even on phones (matches the design). */
export const PORTFOLIO_GRID = "grid grid-cols-2 gap-3.5 md:grid-cols-3";

export const SECTION_HEAD = "flex items-center justify-between mb-3";
export const SECTION_TITLE = "m-0 text-[17px] font-extrabold text-ink";
export const VIEW_ALL =
	"inline-flex items-center gap-0.5 text-primary font-bold text-[13px] no-underline";
