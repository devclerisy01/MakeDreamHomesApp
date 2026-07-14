import { assetUrl } from "@/lib/asset";
import type { PortfolioItem } from "@/types";

/** Display formatters shared across the app. */

/**
 * Formats a stored budget amount for display in the Indian numbering system:
 * `"234100000"` → `"₹ 23.41 Cr"`. Returns `null` for an absent, non-numeric, or
 * non-positive value so callers can fall back cleanly.
 */
export function formatBudget(budget?: string | number | null): string | null {
	if (budget == null || budget === "") return null;
	const amount = Number(budget);
	if (!Number.isFinite(amount) || amount <= 0) return null;

	const trim = (value: number): string =>
		parseFloat(value.toFixed(2)).toString();

	if (amount >= 1_00_00_000) return `₹${trim(amount / 1_00_00_000)} Cr`;
	if (amount >= 1_00_000) return `₹${trim(amount / 1_00_000)} L`;
	if (amount >= 1_000) return `₹${trim(amount / 1_000)} K`;
	return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/**
 * Compact "time ago" label matching the design (`"2h ago"`, `"3d ago"`).
 * Returns `""` for an invalid date.
 */
export function timeAgo(date?: string | Date | null): string {
	if (!date) return "";
	const then = new Date(date).getTime();
	if (!Number.isFinite(then)) return "";
	const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
	if (sec < 60) return "just now";
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	if (day < 7) return `${day}d ago`;
	const wk = Math.floor(day / 7);
	if (wk < 5) return `${wk}w ago`;
	const mo = Math.floor(day / 30);
	if (mo < 12) return `${mo}mo ago`;
	return `${Math.floor(day / 365)}y ago`;
}

/**
 * Formats a 10-digit Indian phone for display: `"9876543210"` →
 * `"+91 98765 43210"`. India-only, matching the web app; the country code is
 * never stored or sent — only the bare digits go to the API.
 */
export function formatPhone(raw: string | null | undefined): string {
	const digits = (raw ?? "").replace(/\D/g, "").slice(-10);
	if (digits.length === 10) {
		return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
	}
	return digits ? `+91 ${digits}` : "";
}

/** Resolves a portfolio item (or raw key) to a displayable image URL. */
export function getImageSrc(item: PortfolioItem | string): string {
	return typeof item === "string"
		? (assetUrl(item) ?? "")
		: (assetUrl(item.image) ?? "");
}
