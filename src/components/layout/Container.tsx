import type { ReactNode } from "react";

/** Responsive page container: full-width on phones, centered + capped on wide. */
export function Container({
	wide = false,
	children,
}: {
	wide?: boolean;
	children: ReactNode;
}) {
	return (
		<div
			className={`mx-auto w-full px-4 pt-1 pb-[calc(1rem+env(safe-area-inset-bottom))] ${
				wide ? "max-w-[980px]" : "max-w-[760px]"
			}`}
		>
			{children}
		</div>
	);
}
