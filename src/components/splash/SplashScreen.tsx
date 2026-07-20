import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useRef } from "react";

import { AnimatedLogo } from "@/components/splash/AnimatedLogo";
import { SPLASH_DURATION } from "@/hooks/useSplash";

const BRAND = "MakeDreamHomes";
const TAGLINE =
	"Hire a professional, buy/sell property or construction material";

/* ── Animation variants ──────────────────────────────────────────────── */

// Brand name: fade-up with blur removal, staggered per character.
const nameContainer: Variants = {
	hidden: {},
	visible: {
		transition: { delayChildren: 1.2, staggerChildren: 0.03 },
	},
};
const nameChar: Variants = {
	hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
	visible: {
		opacity: 1,
		y: 0,
		filter: "blur(0px)",
		transition: { type: "spring", stiffness: 200, damping: 22 },
	},
};

const tagline: Variants = {
	hidden: { opacity: 0, y: 8 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { delay: 1.7, duration: 0.5, ease: "easeOut" },
	},
};

// Blueprint loader line: a thin bar that draws left→right.
const loaderTrack: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { delay: 2.0, duration: 0.3 } },
};
const loaderFill: Variants = {
	hidden: { scaleX: 0 },
	visible: {
		scaleX: 1,
		transition: { delay: 2.05, duration: 0.7, ease: [0.4, 0, 0.2, 1] },
	},
};

// Whole splash exit: gentle scale-down + fade so the homepage shows through.
const overlay: Variants = {
	visible: { opacity: 1, scale: 1 },
	exit: {
		opacity: 0,
		scale: 0.96,
		transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
	},
};

/**
 * Premium animated splash overlay. Plays the phased timeline once (driven by
 * {@link useSplash}), then exits by scaling down + fading out to reveal the
 * homepage underneath — no white flash, no layout shift. Reduced-motion users
 * get a static, instant version.
 */
export function SplashScreen({
	visible,
	reducedMotion,
	onDismiss,
}: {
	visible: boolean;
	reducedMotion: boolean;
	onDismiss: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);

	// Auto-dismiss after the full timeline (reduced-motion is handled by the hook).
	useEffect(() => {
		if (!visible || reducedMotion) return;
		const id = window.setTimeout(onDismiss, SPLASH_DURATION);
		return () => window.clearTimeout(id);
	}, [visible, reducedMotion, onDismiss]);

	// Trap focus so keyboard/AT users can't tab into the homepage behind it.
	useEffect(() => {
		if (!visible) return;
		const prev = document.activeElement as HTMLElement | null;
		ref.current?.focus();
		return () => prev?.focus?.();
	}, [visible]);

	return (
		<AnimatePresence>
			{visible ? (
				<motion.div
					ref={ref}
					tabIndex={-1}
					role="status"
					aria-label="Loading MakeDreamHomes"
					variants={overlay}
					initial="visible"
					animate="visible"
					exit="exit"
					className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-white text-ink outline-none"
					style={{ willChange: "transform, opacity" }}
				>
					{/* Ambient background: soft light-blue radial lighting on white. */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,#e8f3fc,transparent_60%)]"
					/>
					<motion.div
						aria-hidden
						className="pointer-events-none absolute -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(38,66,139,0.14),transparent_70%)] blur-3xl"
						animate={
							reducedMotion
								? undefined
								: { y: [0, 18, 0], opacity: [0.5, 0.8, 0.5] }
						}
						transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
					/>

					{/* Content stack */}
					<div className="relative z-10 flex flex-col items-center px-8 text-center">
						<AnimatedLogo reducedMotion={reducedMotion} />

						{/* Brand name — character-by-character fade-up with blur removal. */}
						<motion.h1
							variants={reducedMotion ? undefined : nameContainer}
							initial={reducedMotion ? false : "hidden"}
							animate={reducedMotion ? undefined : "visible"}
							className="mt-6 flex text-[26px] font-extrabold tracking-tight"
						>
							{reducedMotion
								? BRAND
								: BRAND.split("").map((ch, i) => (
										<motion.span
											key={`${ch}-${i}`}
											variants={nameChar}
											style={{ willChange: "transform, opacity, filter" }}
										>
											{ch}
										</motion.span>
									))}
						</motion.h1>

						{/* Tagline */}
						<motion.p
							variants={reducedMotion ? undefined : tagline}
							initial={reducedMotion ? false : "hidden"}
							animate={reducedMotion ? undefined : "visible"}
							className="mt-2 max-w-[280px] text-[12px] font-medium leading-snug text-muted-light"
						>
							{TAGLINE}
						</motion.p>

						{/* Blueprint loader line */}
						<motion.div
							variants={reducedMotion ? undefined : loaderTrack}
							initial={reducedMotion ? false : "hidden"}
							animate={reducedMotion ? undefined : "visible"}
							className="relative mt-8 h-[3px] w-40 overflow-hidden rounded-full bg-primary/10"
						>
							<motion.div
								variants={reducedMotion ? undefined : loaderFill}
								initial={reducedMotion ? false : "hidden"}
								animate={reducedMotion ? undefined : "visible"}
								className="h-full w-full origin-left rounded-full bg-gradient-to-r from-primary to-primary-dark"
								style={{ willChange: "transform" }}
							/>
						</motion.div>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
