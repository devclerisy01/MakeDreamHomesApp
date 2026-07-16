import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

/**
 * Native speech-to-text via `@capacitor-community/speech-recognition`. The web
 * `SpeechRecognition` API is absent from the Android System WebView, so the
 * "Tap to speak" button never works on a real device with it — this uses the
 * platform recognizer instead. Handles the OS microphone permission (prompts,
 * reports denial) so callers can show a friendly message, mirroring the
 * check-permission-then-handle-denial pattern used for geolocation.
 */
export type SpeechStartResult =
	{ ok: true } | { ok: false; reason: "denied" | "unavailable" };

/** True only on a native Capacitor platform where the plugin is usable. */
export function isNativeSpeech(): boolean {
	return Capacitor.isNativePlatform();
}

let partialHandle: { remove: () => Promise<void> } | null = null;
let stateHandle: { remove: () => Promise<void> } | null = null;

async function cleanupListeners(): Promise<void> {
	try {
		await partialHandle?.remove();
		await stateHandle?.remove();
	} catch {
		/* already gone */
	}
	partialHandle = null;
	stateHandle = null;
}

/**
 * Starts listening. `onPartial` fires with the best transcript-so-far as speech
 * streams in (each call replaces the previous partial, not appends); `onEnd`
 * fires once when recognition stops (user tap, silence, or error). Resolves as
 * soon as listening begins, or with a typed failure if unavailable/denied.
 */
export async function startNativeSpeech(opts: {
	language?: string;
	onPartial: (text: string) => void;
	onEnd: () => void;
}): Promise<SpeechStartResult> {
	try {
		const { available } = await SpeechRecognition.available();
		if (!available) return { ok: false, reason: "unavailable" };

		let status = await SpeechRecognition.checkPermissions();
		if (status.speechRecognition !== "granted") {
			status = await SpeechRecognition.requestPermissions();
			if (status.speechRecognition !== "granted") {
				return { ok: false, reason: "denied" };
			}
		}

		// Drop any stale listeners from a previous session before re-attaching.
		await cleanupListeners();

		partialHandle = await SpeechRecognition.addListener(
			"partialResults",
			(data) => {
				const text = data?.matches?.[0]?.trim();
				if (text) opts.onPartial(text);
			},
		);
		stateHandle = await SpeechRecognition.addListener(
			"listeningState",
			(data) => {
				if (data?.status === "stopped") {
					void cleanupListeners();
					opts.onEnd();
				}
			},
		);

		await SpeechRecognition.start({
			language: opts.language ?? "en-IN",
			maxResults: 1,
			partialResults: true,
			popup: false,
		});
		return { ok: true };
	} catch {
		await cleanupListeners();
		return { ok: false, reason: "unavailable" };
	}
}

/** Stops an in-progress session and detaches listeners. Safe to call anytime. */
export async function stopNativeSpeech(): Promise<void> {
	try {
		await SpeechRecognition.stop();
	} catch {
		/* not listening */
	}
	await cleanupListeners();
}
