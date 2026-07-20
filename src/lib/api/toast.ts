import { toastController } from "@ionic/core";
import { close as closeIcon } from "ionicons/icons";

/**
 * The single place that shows a toast in the app. Imperative (works OUTSIDE
 * React — Ionic's `useIonToast` is a hook), so it backs BOTH the central
 * API-message → toast layer ({@link ./middleware}) and every component's local
 * success/error message via {@link toastSuccess} / {@link toastError} /
 * {@link toastInfo}. Components should call those helpers instead of
 * `useIonToast`, so styling + dedupe live in one place (mirrors the web app's
 * central toast and capExpert's shared toast service).
 */

type ToastKind = "success" | "error" | "info" | "warning";

/** Dedupe window: swallow an identical message fired again within this many ms. */
const DEDUPE_MS = 700;

let last: { message: string; at: number } | null = null;

/**
 * Monotonic-ish clock that tolerates environments where `Date.now` is patched
 * out — falls back to `performance.now()`.
 */
function now(): number {
	if (typeof performance !== "undefined" && performance.now) {
		return performance.now();
	}
	return Date.now();
}

/**
 * Shows a single Ionic toast. Success is brief and green; errors linger and are
 * red; info/warnings are yellow. Identical back-to-back messages (e.g. two mounted
 * components, or a refresh-retry) within {@link DEDUPE_MS} collapse into one.
 */
export async function presentToast(
	message: string,
	kind: ToastKind = "success",
): Promise<void> {
	const trimmed = message?.trim();
	if (!trimmed) return;

	const at = now();
	if (last && last.message === trimmed && at - last.at < DEDUPE_MS) return;
	last = { message: trimmed, at };

	let headerText = "Info";
	if (kind === "success") headerText = "Success";
	else if (kind === "error") headerText = "Error";
	else if (kind === "warning") headerText = "Warning";

	try {
		const toast = await toastController.create({
			header: headerText,
			message: trimmed,
			duration: kind === "success" ? 2500 : kind === "error" ? 3500 : 3000,
			position: "top",
			// Colors + layout come from `.mdh-toast*` CSS.
			cssClass: `mdh-toast mdh-toast--${kind}`,
			buttons: [
				{
					icon: closeIcon,
					role: "cancel",
				},
			],
		});
		await toast.present();
	} catch {
		// A toast failing to present must never break the calling flow.
	}
}

/** Show a success (green) toast. The common entry point for local success. */
export function toastSuccess(message: string): void {
	void presentToast(message, "success");
}

/** Show an error (red) toast. The common entry point for local errors. */
export function toastError(message: string): void {
	void presentToast(message, "error");
}

/** Show a neutral info toast (capability notices, "coming soon", hints). */
export function toastInfo(message: string): void {
	void presentToast(message, "info");
}

/** Show a warning (yellow) toast. */
export function toastWarning(message: string): void {
	void presentToast(message, "warning");
}
