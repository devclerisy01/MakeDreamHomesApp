import { motion, type Transition, type Variants } from "framer-motion";

/**
 * The brand mark (crescent moon + house + stars), animated in on the splash.
 * Phase 2 of the timeline: spring scale 0.75→1, fade 0→1, gentle rise + rotate,
 * with a soft glow that blooms and fades. GPU-accelerated (transform/opacity
 * only). The moon/stars use `currentColor` so the mark adapts to light/dark.
 */

const spring: Transition = {
	type: "spring",
	stiffness: 140,
	damping: 18,
	mass: 0.9,
};

const markVariants: Variants = {
	hidden: { opacity: 0, scale: 0.75, y: 16, rotate: -4 },
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		rotate: 0,
		transition: { ...spring, delay: 0.3 },
	},
};

const glowVariants: Variants = {
	hidden: { opacity: 0, scale: 0.6 },
	visible: {
		opacity: [0, 0.55, 0.25],
		scale: [0.6, 1.15, 1],
		transition: { duration: 1.1, delay: 0.35, ease: "easeOut" },
	},
};

export function AnimatedLogo({
	reducedMotion = false,
}: {
	reducedMotion?: boolean;
}) {
	return (
		<div className="relative grid place-items-center" aria-hidden="true">
			{/* Soft ambient glow behind the mark. */}
			<motion.div
				variants={glowVariants}
				initial={reducedMotion ? "visible" : "hidden"}
				animate="visible"
				className="pointer-events-none absolute h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(38,66,139,0.35),transparent_70%)] blur-2xl"
				style={{ willChange: "transform, opacity" }}
			/>
			{/* Logo mark on the white splash background (dark moon + blue house). */}
			<motion.div
				variants={markVariants}
				initial={reducedMotion ? "visible" : "hidden"}
				animate="visible"
				className="relative"
				style={{ willChange: "transform, opacity" }}
			>
				<svg
					viewBox="0 0 37 37"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="h-24 w-24 text-ink"
				>
					<path
						d="M22.0584 16.1719L13.1406 22.9587H14.5999V32.0617H20.1359V26.9427H23.9809V32.0617H29.5169V22.9587H30.9762L22.0584 16.1719Z"
						fill="#26428B"
					/>
					<path
						d="M35.3763 22.4661C34.2622 27.1383 31.3368 31.3583 26.9112 33.9493C18.3361 38.9699 7.35463 35.986 2.40389 27.2902C-2.54702 18.5943 0.395458 7.4584 8.97059 2.43779C13.3962 -0.1533 18.4627 -0.612424 23.01 0.745219C19.93 0.424528 16.7265 1.04796 13.843 2.73616C6.55423 7.00364 4.05302 16.4693 8.26125 23.8607C12.4695 31.2523 21.8037 33.7886 29.0927 29.5211C31.9761 27.8329 34.1102 25.3311 35.3763 22.4661Z"
						fill="currentColor"
					/>
					<path
						d="M32.3428 16.1719C32.5554 17.8082 32.7281 17.9807 34.3643 18.1934C32.7281 18.406 32.5554 18.5785 32.3428 20.2148C32.1301 18.5785 31.9577 18.406 30.3213 18.1934C31.9577 17.9807 32.1301 17.8083 32.3428 16.1719ZM12.1279 12.6338C12.4469 15.0884 12.7057 15.347 15.1602 15.666C12.7056 15.985 12.4469 16.2446 12.1279 18.6992C11.8089 16.2446 11.5504 15.985 9.0957 15.666C11.5504 15.347 11.8089 15.0885 12.1279 12.6338ZM23.752 6.06445C24.1241 8.92802 24.4256 9.22943 27.2891 9.60156C24.4255 9.9737 24.1241 10.276 23.752 13.1396C23.3798 10.2759 23.0777 9.97372 20.2139 9.60156C23.0776 9.22941 23.3798 8.92819 23.752 6.06445ZM32.3428 8.08594C32.5554 9.72224 32.7281 9.89478 34.3643 10.1074C32.7281 10.3201 32.5554 10.4926 32.3428 12.1289C32.1301 10.4925 31.9577 10.3201 30.3213 10.1074C31.9577 9.89477 32.1301 9.72228 32.3428 8.08594ZM15.666 6.06445C15.9318 8.10981 16.1471 8.32502 18.1924 8.59082C16.1469 8.85664 15.9318 9.07266 15.666 11.1182C15.4002 9.07262 15.1842 8.85664 13.1387 8.59082C15.1842 8.325 15.4002 8.10997 15.666 6.06445ZM25.7734 0C25.9329 1.22706 26.0621 1.35616 27.2891 1.51562C26.0619 1.67511 25.9329 1.80497 25.7734 3.03223C25.6139 1.8049 25.4842 1.67512 24.2568 1.51562C25.4841 1.35614 25.614 1.22722 25.7734 0Z"
						fill="currentColor"
					/>
				</svg>
			</motion.div>
		</div>
	);
}
