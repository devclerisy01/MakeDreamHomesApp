import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Detects whether a line-clamped element is actually overflowing (its full
 * content is taller than the clamped box). Uses a ResizeObserver so it stays
 * correct even when the element is measured before layout settles (e.g. while an
 * Ionic page/modal transitions in) — plain mount-time measurement can miss that.
 *
 * @param dep re-measure when this changes (usually the clamped text).
 */
export function useClampOverflow<T extends HTMLElement>(
	dep: unknown,
): { ref: RefObject<T | null>; overflows: boolean } {
	const ref = useRef<T>(null);
	const [overflows, setOverflows] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => setOverflows(el.scrollHeight - el.clientHeight > 1);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, [dep]);

	return { ref, overflows };
}
