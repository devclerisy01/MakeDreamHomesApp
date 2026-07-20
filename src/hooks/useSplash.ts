import { useCallback, useEffect, useState } from "react";

/** Session key so the splash plays once per browser session, not every load. */
const SESSION_KEY = "mdh.splash.seen";

/** Total splash lifetime (ms) — matches the SplashScreen animation timeline. */
export const SPLASH_DURATION = 2800;

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined" || !window.matchMedia) return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function alreadySeen(): boolean {
	try {
		return sessionStorage.getItem(SESSION_KEY) === "1";
	} catch {
		return false;
	}
}

function markSeen(): void {
	try {
		sessionStorage.setItem(SESSION_KEY, "1");
	} catch {
		// sessionStorage can throw in private mode — the splash simply replays.
	}
}

interface UseSplash {
	/** Whether the splash overlay should currently be mounted. */
	visible: boolean;
	/** True when the user opted out of motion — render a static, instant splash. */
	reducedMotion: boolean;
	/** Call when the exit animation finishes to unmount the overlay. */
	dismiss: () => void;
}

/**
 * Drives the animated splash: shows it once per session, auto-dismisses after
 * the timeline (immediately for reduced-motion users), and lets the SplashScreen
 * unmount itself once its exit transition completes.
 */
/**
 * When true the splash replays on every page load/refresh (dev/testing only).
 * Production: false → the splash shows once per browser session.
 */
const ALWAYS_SHOW = false;

export function useSplash(): UseSplash {
	const reducedMotion = prefersReducedMotion();
	// Show on every load while testing; otherwise skip repeat visits this session.
	const [visible, setVisible] = useState(() =>
		ALWAYS_SHOW ? true : !alreadySeen(),
	);

	const dismiss = useCallback(() => {
		markSeen();
		setVisible(false);
	}, []);

	// Reduced-motion users get an instant hand-off (no long timeline).
	useEffect(() => {
		if (!visible || !reducedMotion) return;
		markSeen();
		const id = window.setTimeout(() => setVisible(false), 200);
		return () => window.clearTimeout(id);
	}, [visible, reducedMotion]);

	// Mark seen as soon as it shows, so a fast reload mid-animation still skips
	// (no-op effect while ALWAYS_SHOW is on, but harmless).
	useEffect(() => {
		if (visible && !ALWAYS_SHOW) markSeen();
	}, [visible]);

	return { visible, reducedMotion, dismiss };
}
