/**
 * Hero banner illustration — the "open house" artwork exported from the Figma
 * design (`public/hero-illustration.svg`). Rendered as an <img> so it scales
 * crisply from the committed vector asset.
 */
export function HeroArt({ className = "" }: { className?: string }) {
	return (
		<img
			src="/hero-illustration.svg"
			alt="A person presenting a house"
			className={className}
		/>
	);
}
