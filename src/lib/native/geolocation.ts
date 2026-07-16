import { Geolocation } from "@capacitor/geolocation";

/**
 * Permission-aware geolocation. On native (Capacitor) this asks the OS for the
 * location permission (showing the system prompt) and reads the position; on web
 * it falls back to the browser prompt. Denial and failure are reported as a
 * typed result so callers can show a friendly message instead of crashing —
 * mirroring capExpert's check-permission-then-handle-denial pattern.
 */
export type CoordsResult =
	| { ok: true; latitude: number; longitude: number }
	| { ok: false; reason: "denied" | "unavailable" };

const OPTIONS = {
	enableHighAccuracy: false,
	timeout: 8000,
	maximumAge: 600_000,
};

export async function getCurrentCoords(): Promise<CoordsResult> {
	try {
		// Ask for permission first (native shows the OS dialog). checkPermissions/
		// requestPermissions may be unimplemented on web — fall through if so.
		try {
			const status = await Geolocation.checkPermissions();
			const granted =
				status.location === "granted" || status.coarseLocation === "granted";
			if (!granted) {
				const req = await Geolocation.requestPermissions();
				if (req.location === "denied" && req.coarseLocation === "denied") {
					return { ok: false, reason: "denied" };
				}
			}
		} catch {
			/* web / unsupported — let getCurrentPosition trigger the prompt */
		}

		const pos = await Geolocation.getCurrentPosition(OPTIONS);
		return {
			ok: true,
			latitude: pos.coords.latitude,
			longitude: pos.coords.longitude,
		};
	} catch (error) {
		// GeolocationPositionError.code === 1 is PERMISSION_DENIED.
		const code = (error as { code?: number } | null)?.code;
		return { ok: false, reason: code === 1 ? "denied" : "unavailable" };
	}
}

/**
 * Reads the position ONLY if location permission is already granted — never
 * prompts. Used for the silent app-launch auto-detect so first launch doesn't
 * pop a permission dialog before the user has asked for anything.
 */
export async function getCurrentCoordsIfGranted(): Promise<CoordsResult> {
	try {
		const status = await Geolocation.checkPermissions();
		if (status.location !== "granted" && status.coarseLocation !== "granted") {
			return { ok: false, reason: "denied" };
		}
		const pos = await Geolocation.getCurrentPosition(OPTIONS);
		return {
			ok: true,
			latitude: pos.coords.latitude,
			longitude: pos.coords.longitude,
		};
	} catch {
		return { ok: false, reason: "unavailable" };
	}
}
