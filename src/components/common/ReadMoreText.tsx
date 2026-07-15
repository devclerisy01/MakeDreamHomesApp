import { useState } from "react";

import { BoxModal } from "@/components/common/BoxModal";
import { useClampOverflow } from "@/hooks/useClampOverflow";

interface ReadMoreTextProps {
	text: string;
	/** Lines to clamp to before showing "Read more". */
	lines?: number;
	/** Popup title. */
	title?: string;
	/** Classes for the clamped paragraph. */
	className?: string;
}

/**
 * Text that clamps to `lines` and, only when it actually overflows, reveals a
 * "Read more" link that opens the full text in a box popup — mirroring the web's
 * clamp-and-Read-more pattern (used for About / long descriptions).
 */
export function ReadMoreText({
	text,
	lines = 4,
	title = "Details",
	className = "",
}: ReadMoreTextProps) {
	const { ref, overflows } = useClampOverflow<HTMLParagraphElement>(text);
	const [open, setOpen] = useState(false);

	if (!text) return null;

	return (
		<>
			<p
				ref={ref}
				className={className}
				style={{
					display: "-webkit-box",
					WebkitBoxOrient: "vertical",
					WebkitLineClamp: lines,
					overflow: "hidden",
				}}
			>
				{text}
			</p>
			{overflows ? (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="mt-0.5 text-[13px] font-bold text-primary"
				>
					Read more
				</button>
			) : null}

			<BoxModal isOpen={open} onClose={() => setOpen(false)} title={title}>
				<p className="m-0 whitespace-pre-line text-[15px] leading-relaxed text-muted">
					{text}
				</p>
			</BoxModal>
		</>
	);
}
