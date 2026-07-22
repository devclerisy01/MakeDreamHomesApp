import { IonIcon, IonModal } from "@ionic/react";
import {
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { ICONS } from "@/theme/icons";

/** Square output size of the cropped avatar (px). */
const OUTPUT_SIZE = 512;
/** On-screen size of the crop viewport (px). */
const VIEWPORT = 280;

interface ImageCropperModalProps {
	/** The picked file to crop; null keeps the sheet closed. */
	file: File | null;
	onClose: () => void;
	/** Called with the cropped square image (ready to upload). */
	onCropped: (cropped: File) => void;
}

/**
 * Lightweight square-avatar cropper (P3): drag to pan, use the slider to zoom,
 * choosing exactly what shows. On confirm the visible region is rendered to a
 * canvas and returned as a square File — no external dependency, and it plugs
 * straight into the existing presigned-upload flow. Ported from the web cropper.
 */
export function ImageCropperModal({
	file,
	onClose,
	onCropped,
}: ImageCropperModalProps) {
	// Object URL for previewing, created in an effect and revoked on cleanup.
	const [src, setSrc] = useState("");
	// Natural (intrinsic) size, read from the <img>'s onLoad.
	const [natural, setNatural] = useState({ w: 0, h: 0 });
	// Zoom multiplier applied on top of the "cover" base scale.
	const [zoom, setZoom] = useState(1);
	// Pan offset (px) of the image centre relative to the viewport centre.
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [busy, setBusy] = useState(false);

	const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
		null,
	);
	// The live preview <img>, reused as the canvas source (already decoded).
	const imgRef = useRef<HTMLImageElement>(null);

	// Create the preview object URL for this file and reset the transform; revoke
	// the URL on cleanup / when the file changes.
	useEffect(() => {
		if (!file) {
			setSrc("");
			return;
		}
		setZoom(1);
		setOffset({ x: 0, y: 0 });
		setNatural({ w: 0, h: 0 });
		const url = URL.createObjectURL(file);
		setSrc(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	// Base scale so the image "covers" the square viewport at zoom = 1.
	const baseScale =
		natural.w && natural.h
			? Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h)
			: 1;
	const scale = baseScale * zoom;
	const drawnW = natural.w * scale;
	const drawnH = natural.h * scale;

	/** Clamp the pan so the image always fully covers the viewport. */
	const clamp = useCallback(
		(x: number, y: number) => {
			const maxX = Math.max(0, (drawnW - VIEWPORT) / 2);
			const maxY = Math.max(0, (drawnH - VIEWPORT) / 2);
			return {
				x: Math.min(maxX, Math.max(-maxX, x)),
				y: Math.min(maxY, Math.max(-maxY, y)),
			};
		},
		[drawnW, drawnH],
	);

	/** Change zoom, then re-clamp the pan so the image still covers the box. */
	function changeZoom(next: number) {
		const z = Math.min(3, Math.max(1, next));
		const s = baseScale * z;
		const maxX = Math.max(0, (natural.w * s - VIEWPORT) / 2);
		const maxY = Math.max(0, (natural.h * s - VIEWPORT) / 2);
		setZoom(z);
		setOffset((o) => ({
			x: Math.min(maxX, Math.max(-maxX, o.x)),
			y: Math.min(maxY, Math.max(-maxY, o.y)),
		}));
	}

	function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
		e.currentTarget.setPointerCapture(e.pointerId);
		drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
	}
	function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
		if (!drag.current) return;
		const dx = e.clientX - drag.current.x;
		const dy = e.clientY - drag.current.y;
		setOffset(clamp(drag.current.ox + dx, drag.current.oy + dy));
	}
	function onPointerUp() {
		drag.current = null;
	}

	/** Render the chosen crop to a square canvas and hand back a File. */
	async function handleConfirm() {
		const img = imgRef.current;
		if (!img || !natural.w || busy) return;
		setBusy(true);
		try {
			const canvas = document.createElement("canvas");
			canvas.width = OUTPUT_SIZE;
			canvas.height = OUTPUT_SIZE;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("no 2d context");

			// Map the on-screen viewport → source pixels. `ratio` scales the output
			// canvas up from the on-screen viewport.
			const ratio = OUTPUT_SIZE / VIEWPORT;
			const drawX = (VIEWPORT - drawnW) / 2 + offset.x;
			const drawY = (VIEWPORT - drawnH) / 2 + offset.y;
			ctx.drawImage(
				img,
				drawX * ratio,
				drawY * ratio,
				drawnW * ratio,
				drawnH * ratio,
			);

			const blob: Blob | null = await new Promise((resolve) =>
				canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
			);
			if (!blob) throw new Error("crop failed");
			onCropped(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
		} finally {
			setBusy(false);
		}
	}

	return (
		<IonModal
			isOpen={!!file}
			onDidDismiss={onClose}
			initialBreakpoint={1}
			breakpoints={[0, 1]}
		>
			<div className="flex h-full flex-col bg-surface-muted">
				<div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
					<button
						type="button"
						onClick={onClose}
						disabled={busy}
						className="text-sm font-semibold text-muted disabled:opacity-50"
					>
						Cancel
					</button>
					<h2 className="m-0 text-base font-extrabold text-ink">
						Adjust Photo
					</h2>
					<span className="w-12" aria-hidden />
				</div>

				<div className="flex-1 overflow-y-auto px-4 py-6">
					<div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-5">
						<p className="m-0 text-center text-[13px] text-muted-light">
							Drag to reposition, and use the slider to zoom.
						</p>

						{/* Crop viewport */}
						<div
							onPointerDown={onPointerDown}
							onPointerMove={onPointerMove}
							onPointerUp={onPointerUp}
							onPointerCancel={onPointerUp}
							style={{ width: VIEWPORT, height: VIEWPORT }}
							className="relative touch-none overflow-hidden rounded-2xl bg-surface-muted"
						>
							{src ? (
								<img
									ref={imgRef}
									src={src}
									alt=""
									draggable={false}
									onLoad={(e) =>
										setNatural({
											w: e.currentTarget.naturalWidth,
											h: e.currentTarget.naturalHeight,
										})
									}
									style={
										natural.w
											? {
													width: drawnW,
													height: drawnH,
													transform: `translate(${offset.x}px, ${offset.y}px)`,
												}
											: { visibility: "hidden" }
									}
									className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
								/>
							) : null}
							{/* Guide ring so the user sees the safe area. */}
							<span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10" />
						</div>

						{/* Zoom slider */}
						<label className="flex w-full max-w-[280px] items-center gap-3">
							<span className="text-xs font-semibold text-muted">Zoom</span>
							<input
								type="range"
								min={1}
								max={3}
								step={0.01}
								value={zoom}
								onChange={(e) => changeZoom(Number(e.target.value))}
								className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-primary"
							/>
						</label>

						<button
							type="button"
							onClick={() => void handleConfirm()}
							disabled={busy || !src}
							className="flex w-full max-w-[280px] items-center justify-center gap-2 rounded-[8px] bg-primary py-3.5 text-[15px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
						>
							{busy ? "Applying…" : "Apply"}
							{busy ? null : (
								<IonIcon icon={ICONS.arrowForward} className="text-lg" />
							)}
						</button>
					</div>
				</div>
			</div>
		</IonModal>
	);
}
