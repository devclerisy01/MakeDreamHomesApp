import { IonIcon } from "@ionic/react";
import {
	addOutline,
	chevronBackOutline,
	chevronForwardOutline,
	closeOutline,
	refreshOutline,
	removeOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ICONS } from "@/theme/icons";

/** One slide in the lightbox — a resolved image URL + optional caption. */
export interface LightboxImage {
	src: string;
	title?: string;
	subtitle?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
/** Horizontal drag (px) past which a non-zoomed swipe changes image. */
const SWIPE_THRESHOLD = 60;

/**
 * Fullscreen image viewer — zoom (buttons / double-tap / wheel / pinch), pan
 * when zoomed, swipe or arrows to change image, a thumbnail rail, a counter,
 * captions, and keyboard controls (Esc / ← / →). Mirrors the web
 * `PortfolioLightbox`. Rendered into a body portal so it sits above modals.
 * Controlled: pass `index` (the open slide) and `null` handling by the parent.
 */
export function Lightbox({
	images,
	index,
	onIndexChange,
	onClose,
}: {
	images: LightboxImage[];
	index: number;
	onIndexChange: (next: number) => void;
	onClose: () => void;
}) {
	const total = images.length;
	const clamp = useCallback((i: number) => (i + total) % total, [total]);

	const [scale, setScale] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [dragging, setDragging] = useState(false);

	// Gesture bookkeeping.
	const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
	const lastPan = useRef({ x: 0, y: 0 });
	const swipeStart = useRef<{ x: number; y: number } | null>(null);
	const pinch = useRef<{ dist: number; scale: number } | null>(null);
	const lastTap = useRef(0);

	const reset = useCallback(() => {
		setScale(1);
		setPan({ x: 0, y: 0 });
	}, []);

	const goPrev = useCallback(() => {
		reset();
		onIndexChange(clamp(index - 1));
	}, [clamp, index, onIndexChange, reset]);
	const goNext = useCallback(() => {
		reset();
		onIndexChange(clamp(index + 1));
	}, [clamp, index, onIndexChange, reset]);

	// Keyboard + background scroll lock while open.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			else if (e.key === "ArrowLeft") goPrev();
			else if (e.key === "ArrowRight") goNext();
		};
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [goPrev, goNext, onClose]);

	const zoomBy = (delta: number) =>
		setScale((s) => Math.min(Math.max(s + delta, MIN_SCALE), MAX_SCALE));

	const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
		Math.hypot(a.x - b.x, a.y - b.y);

	function onPointerDown(e: React.PointerEvent) {
		(e.target as Element).setPointerCapture?.(e.pointerId);
		pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (pointers.current.size === 2) {
			const [a, b] = [...pointers.current.values()];
			pinch.current = { dist: dist(a, b), scale };
			swipeStart.current = null;
		} else {
			lastPan.current = { x: e.clientX, y: e.clientY };
			swipeStart.current = { x: e.clientX, y: e.clientY };
			// Double-tap to toggle zoom.
			const now = e.timeStamp;
			if (now - lastTap.current < 300) {
				if (scale > 1) reset();
				else setScale(2.5);
			}
			lastTap.current = now;
		}
	}

	function onPointerMove(e: React.PointerEvent) {
		if (!pointers.current.has(e.pointerId)) return;
		pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.current.size === 2 && pinch.current) {
			const [a, b] = [...pointers.current.values()];
			const ratio = dist(a, b) / (pinch.current.dist || 1);
			setScale(
				Math.min(Math.max(pinch.current.scale * ratio, MIN_SCALE), MAX_SCALE),
			);
			return;
		}
		if (scale > 1) {
			const dx = e.clientX - lastPan.current.x;
			const dy = e.clientY - lastPan.current.y;
			lastPan.current = { x: e.clientX, y: e.clientY };
			setDragging(true);
			setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
		}
	}

	function onPointerUp(e: React.PointerEvent) {
		const start = swipeStart.current;
		// Swipe to change image only when not zoomed and it was a single pointer.
		if (start && scale === 1 && pointers.current.size === 1) {
			const dx = e.clientX - start.x;
			const dy = e.clientY - start.y;
			if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
				if (dx < 0) goNext();
				else goPrev();
			}
		}
		pointers.current.delete(e.pointerId);
		if (pointers.current.size < 2) pinch.current = null;
		swipeStart.current = null;
		setDragging(false);
	}

	const active = images[index];
	if (!active || typeof document === "undefined") return null;

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-label={active.title || "Image viewer"}
			className="fixed inset-0 flex flex-col bg-black/90"
			style={{ zIndex: 100000 }}
			onClick={onClose}
		>
			{/* Top bar: counter + close */}
			<div
				className="relative flex shrink-0 items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3"
				onClick={(e) => e.stopPropagation()}
			>
				{total > 1 ? (
					<span className="text-sm font-semibold text-white/90">
						{index + 1} / {total}
					</span>
				) : null}
				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white active:bg-white/20"
				>
					<IonIcon icon={closeOutline} className="text-xl" />
				</button>
			</div>

			{/* Stage */}
			<div
				className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4"
				onClick={(e) => e.stopPropagation()}
				onWheel={(e) => zoomBy(e.deltaY < 0 ? 0.15 : -0.15)}
			>
				{total > 1 ? (
					<button
						type="button"
						onClick={goPrev}
						aria-label="Previous"
						className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white active:bg-white/20"
					>
						<IonIcon icon={chevronBackOutline} className="text-2xl" />
					</button>
				) : null}

				<img
					key={index}
					src={active.src}
					alt={active.title ?? "Image"}
					draggable={false}
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
					style={{
						transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
						transition: dragging ? "none" : "transform 0.2s",
						cursor: scale > 1 ? "grab" : "default",
						touchAction: "none",
					}}
					className="max-h-full max-w-full select-none object-contain"
				/>

				{total > 1 ? (
					<button
						type="button"
						onClick={goNext}
						aria-label="Next"
						className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white active:bg-white/20"
					>
						<IonIcon icon={chevronForwardOutline} className="text-2xl" />
					</button>
				) : null}

				{active.title || active.subtitle ? (
					<div className="pointer-events-none absolute inset-x-4 bottom-3 rounded-2xl bg-black/40 px-4 py-2 text-center">
						{active.title ? (
							<p className="m-0 text-sm font-bold text-white">{active.title}</p>
						) : null}
						{active.subtitle ? (
							<p className="m-0 mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-white/85">
								<IonIcon icon={ICONS.location} />
								{active.subtitle}
							</p>
						) : null}
					</div>
				) : null}
			</div>

			{/* Zoom controls */}
			<div
				className="mx-auto mb-2 flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-2 py-1.5 text-white"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					onClick={() => zoomBy(-0.25)}
					disabled={scale <= MIN_SCALE}
					aria-label="Zoom out"
					className="grid h-8 w-8 place-items-center rounded-full active:bg-white/20 disabled:opacity-40"
				>
					<IonIcon icon={removeOutline} className="text-lg" />
				</button>
				<span className="w-11 text-center text-xs font-semibold tabular-nums">
					{Math.round(scale * 100)}%
				</span>
				<button
					type="button"
					onClick={() => zoomBy(0.25)}
					disabled={scale >= MAX_SCALE}
					aria-label="Zoom in"
					className="grid h-8 w-8 place-items-center rounded-full active:bg-white/20 disabled:opacity-40"
				>
					<IonIcon icon={addOutline} className="text-lg" />
				</button>
				<span className="mx-0.5 h-4 w-px bg-white/20" />
				<button
					type="button"
					onClick={reset}
					aria-label="Reset zoom"
					className="grid h-8 w-8 place-items-center rounded-full active:bg-white/20"
				>
					<IonIcon icon={refreshOutline} className="text-base" />
				</button>
			</div>

			{/* Thumbnail rail */}
			{total > 1 ? (
				<div
					className="flex shrink-0 items-center gap-2 overflow-x-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					onClick={(e) => e.stopPropagation()}
				>
					{images.map((img, i) => (
						<button
							key={i}
							type="button"
							onClick={() => {
								reset();
								onIndexChange(i);
							}}
							aria-current={i === index}
							className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
								i === index
									? "border-white opacity-100"
									: "border-transparent opacity-60"
							}`}
						>
							<img
								src={img.src}
								alt=""
								className="h-full w-full object-cover"
							/>
						</button>
					))}
				</div>
			) : null}
		</div>,
		document.body,
	);
}
