import { IonIcon } from "@ionic/react";

// Ionicons full/half/empty stars: this multi-state row must tint via `text-star`
// (the single-state gold custom star is used on cards via ICONS.star instead).
import { star, starHalf, starOutline } from "ionicons/icons";

interface StarsProps {
	value: number;
	size?: "sm" | "lg";
}

/** Five-star row; renders full / half / empty stars for `value` (0–5). */
export function Stars({ value, size = "sm" }: StarsProps) {
	return (
		<span
			className={`inline-flex gap-px leading-none text-star ${
				size === "lg" ? "text-[22px]" : "text-sm"
			}`}
		>
			{[0, 1, 2, 3, 4].map((i) => {
				const icon =
					value >= i + 1 ? star : value >= i + 0.5 ? starHalf : starOutline;
				return <IonIcon key={i} icon={icon} />;
			})}
		</span>
	);
}
