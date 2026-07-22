import { IonIcon } from "@ionic/react";

import { assetUrl } from "@/lib/asset";

interface AvatarProps {
	name: string;
	image?: string;
	/** Square side length in px. Ignored when `fill` is set. */
	size?: number;
	/** Fill the parent box (parent controls width/height) instead of a fixed square. */
	fill?: boolean;
	className?: string;
	/** Icon shown instead of the name initials when there's no image (e.g. a
	 *  per-track directory placeholder). */
	fallbackIcon?: string;
}

/** Avatar: shows the resolved image, a fallback icon, or the name's initials. */
export function Avatar({
	name,
	image,
	size = 48,
	fill = false,
	className = "",
	fallbackIcon,
}: AvatarProps) {
	const url = assetUrl(image);
	const initials =
		(name ?? "")
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word.charAt(0).toUpperCase())
			.join("") || "?";
	return (
		<div
			className={`grid ${fill ? "h-full w-full" : "shrink-0"} place-items-center overflow-hidden rounded-[10px] bg-primary-light font-bold text-primary-dark ${className}`}
			style={
				fill
					? { fontSize: 22 }
					: { width: size, height: size, fontSize: Math.round(size / 2.6) }
			}
		>
			{url ? (
				<img
					src={url}
					alt={name}
					loading="lazy"
					className="h-full w-full object-cover"
				/>
			) : fallbackIcon ? (
				<IonIcon
					icon={fallbackIcon}
					className="text-[1.75em] text-primary/70"
				/>
			) : (
				<span>{initials}</span>
			)}
		</div>
	);
}
