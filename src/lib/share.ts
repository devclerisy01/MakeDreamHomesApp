import { toastError, toastInfo } from "@/lib/api/toast";

/**
 * Share a URL via the platform share sheet when available (`navigator.share`
 * works in the Capacitor WebView on iOS/Android), otherwise copy it to the
 * clipboard and confirm. `@capacitor/share` isn't bundled, so this Web-API path
 * is the native share hook (SH1/SH2). A dismissed share sheet is a no-op.
 */
export async function shareLink(url: string, title: string): Promise<void> {
	const nav = navigator as Navigator & {
		share?: (data: ShareData) => Promise<void>;
	};
	if (typeof nav.share === "function") {
		try {
			await nav.share({ title, url });
		} catch {
			/* user dismissed the share sheet — nothing to do */
		}
		return;
	}
	try {
		await navigator.clipboard.writeText(url);
		toastInfo("Profile link copied to clipboard.");
	} catch {
		toastError("Couldn't copy the link.");
	}
}
