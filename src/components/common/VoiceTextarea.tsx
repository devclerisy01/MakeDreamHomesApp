import { IonIcon } from "@ionic/react";
import { useEffect, useRef, useState } from "react";

import { UI_MESSAGES } from "@/constants/messages";
import { toastInfo } from "@/lib/api/toast";
import {
	isNativeSpeech,
	startNativeSpeech,
	stopNativeSpeech,
} from "@/lib/native/speech";
import { ICONS } from "@/theme/icons";

interface SpeechRecognitionLike {
	lang: string;
	interimResults: boolean;
	continuous: boolean;
	start(): void;
	stop(): void;
	onresult: ((event: SpeechResultEvent) => void) | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
}
interface SpeechResultEvent {
	results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
type SpeechCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechCtor | null {
	const w = window as unknown as {
		SpeechRecognition?: SpeechCtor;
		webkitSpeechRecognition?: SpeechCtor;
	};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface VoiceTextareaProps {
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	ariaLabel?: string;
	rows?: number;
	id?: string;
	/** Paints the danger border (validation error). */
	error?: boolean;
	disabled?: boolean;
}

/**
 * Textarea with a "Tap to Speak" dictation pill (bottom-right). Speech streams in
 * via the native platform recognizer on a device (the Android WebView lacks Web
 * Speech) and the Web Speech API on desktop/dev — each transcript appends to
 * whatever the user had typed when dictation started. Shared by the
 * post-requirement description and the profile About editor.
 */
export function VoiceTextarea({
	value,
	onValueChange,
	placeholder,
	ariaLabel,
	rows = 4,
	id,
	error = false,
	disabled = false,
}: VoiceTextareaProps) {
	const [listening, setListening] = useState(false);
	const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
	// Text captured when dictation starts, so streamed transcripts append to what
	// the user already had instead of overwriting it.
	const speechBaseRef = useRef("");
	// Latest value in a ref so the toggle handler snapshots it without being
	// re-created on every keystroke.
	const valueRef = useRef(value);
	valueRef.current = value;

	// Stop any in-progress recognition when the field unmounts.
	useEffect(() => {
		return () => {
			recognitionRef.current?.stop();
			void stopNativeSpeech();
		};
	}, []);

	// Apply a (partial or final) transcript on top of the pre-dictation text.
	function applyTranscript(transcript: string) {
		const base = speechBaseRef.current;
		onValueChange(base ? `${base} ${transcript}` : transcript);
	}

	async function toggleSpeech() {
		if (listening) {
			if (isNativeSpeech()) void stopNativeSpeech();
			else recognitionRef.current?.stop();
			setListening(false);
			return;
		}

		// Snapshot the current text so streamed results append, not overwrite.
		speechBaseRef.current = valueRef.current.trim();

		// Native (real device): the WebView lacks Web Speech, so use the platform
		// recognizer — it prompts for the mic permission and reports denial.
		if (isNativeSpeech()) {
			setListening(true);
			const res = await startNativeSpeech({
				language: "en-IN",
				onPartial: applyTranscript,
				onEnd: () => setListening(false),
			});
			if (!res.ok) {
				setListening(false);
				toastInfo(
					res.reason === "denied"
						? UI_MESSAGES.voiceDenied
						: UI_MESSAGES.voiceUnavailable,
				);
			}
			return;
		}

		// Web fallback (desktop browser / dev): Web Speech API.
		const SpeechRecognition = getSpeechRecognition();
		if (!SpeechRecognition) {
			toastInfo(UI_MESSAGES.voiceUnavailable);
			return;
		}
		const recognition = new SpeechRecognition();
		recognition.lang = "en-IN";
		recognition.interimResults = false;
		recognition.continuous = false;
		recognition.onresult = (event) => {
			const transcript = Array.from(event.results)
				.map((result) => result[0]?.transcript ?? "")
				.join(" ")
				.trim();
			if (transcript) applyTranscript(transcript);
		};
		recognition.onend = () => setListening(false);
		recognition.onerror = () => setListening(false);
		recognitionRef.current = recognition;
		setListening(true);
		recognition.start();
	}

	return (
		<div className="relative" id={id}>
			<textarea
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				rows={rows}
				disabled={disabled}
				placeholder={placeholder}
				aria-label={ariaLabel ?? placeholder}
				className={`w-full resize-none rounded-[9px] border bg-white px-3.5 py-3 pb-12 font-sans text-[12px] text-ink outline-none placeholder:font-medium placeholder:text-[#b2b8c2] focus:border-primary disabled:opacity-60 ${
					error ? "border-danger" : "border-[#dae3ef]"
				}`}
			/>
			<button
				type="button"
				onClick={() => void toggleSpeech()}
				disabled={disabled}
				className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-[52px] px-3 py-1.5 text-[11px] font-bold disabled:opacity-60 ${
					listening ? "bg-primary text-white" : "bg-[#edf2fb] text-primary"
				}`}
			>
				<IonIcon icon={ICONS.micSolid} className="text-[11px]" />
				{listening ? "Listening…" : "Tap to Speak"}
			</button>
		</div>
	);
}
