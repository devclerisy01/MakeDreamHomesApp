/** Chat time/date formatters — ported verbatim from the web app so the mobile
 *  thread + list read identically. */

/** "09:23 AM" — the message-bubble timestamp. */
export function formatTime(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * "Today" / "Yesterday" / "19 July 2026" — the day banner between message
 * groups. today/yesterday come from Intl.RelativeTimeFormat; older days show a
 * full date.
 */
export function formatDateSeparator(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const startOfDay = (x: Date) =>
		new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const diffDays = Math.round(
		(startOfDay(d) - startOfDay(new Date())) / 86_400_000,
	);
	if (diffDays === 0 || diffDays === -1) {
		const label = new Intl.RelativeTimeFormat(undefined, {
			numeric: "auto",
		}).format(diffDays, "day");
		return label.charAt(0).toUpperCase() + label.slice(1);
	}
	return d.toLocaleDateString(undefined, {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

/** Time today, weekday within a week, else a short date — the list timestamp. */
export function formatListTime(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const now = new Date();
	const sameDay = d.toDateString() === now.toDateString();
	if (sameDay)
		return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
	if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
	return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}
