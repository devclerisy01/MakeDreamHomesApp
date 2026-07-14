/**
 * Hero banner illustration — a professional painting a house, in the brand
 * palette. Inline SVG so it scales crisply and needs no network/asset fetch.
 * (Swap for the final brand artwork by dropping a PNG/SVG in `public/` and
 * pointing an <img> here.)
 */
export function HeroArt({ className = "" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 240 180"
			fill="none"
			role="img"
			aria-label="A professional decorating a house"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* soft backdrop */}
			<ellipse cx="152" cy="96" rx="86" ry="80" fill="#EAF0FB" />
			<circle cx="34" cy="34" r="3" fill="#C9D6EF" />
			<circle cx="206" cy="28" r="3.5" fill="#C9D6EF" />
			<circle cx="150" cy="20" r="2.5" fill="#C9D6EF" />
			<path d="M198 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#B9C9EC" />

			{/* ground shadows */}
			<ellipse cx="160" cy="156" rx="70" ry="9" fill="#DCE6F5" />
			<ellipse cx="60" cy="156" rx="26" ry="6" fill="#DCE6F5" />

			{/* chimney (behind roof) */}
			<rect x="190" y="50" width="10" height="20" rx="1.5" fill="#3C5597" />

			{/* house body */}
			<rect
				x="120"
				y="80"
				width="88"
				height="74"
				rx="4"
				fill="#FFFFFF"
				stroke="#D5DEF2"
				strokeWidth="2"
			/>
			{/* roof */}
			<path d="M110 82 L164 44 L218 82 Z" fill="#26428B" />
			<path
				d="M110 82 L164 44 L218 82"
				stroke="#1C3259"
				strokeWidth="2"
				strokeLinejoin="round"
				fill="none"
			/>
			{/* door */}
			<rect x="150" y="112" width="24" height="42" rx="2" fill="#1C3259" />
			<circle cx="169" cy="134" r="1.8" fill="#EAF0FB" />
			{/* windows */}
			<rect
				x="129"
				y="96"
				width="18"
				height="18"
				rx="2"
				fill="#D3E1FA"
				stroke="#26428B"
				strokeWidth="1.5"
			/>
			<path d="M138 96 v18 M129 105 h18" stroke="#26428B" strokeWidth="1.2" />
			<rect
				x="181"
				y="96"
				width="18"
				height="18"
				rx="2"
				fill="#D3E1FA"
				stroke="#26428B"
				strokeWidth="1.5"
			/>
			<path d="M190 96 v18 M181 105 h18" stroke="#26428B" strokeWidth="1.2" />
			{/* fresh paint patch on wall */}
			<rect
				x="120"
				y="80"
				width="16"
				height="40"
				rx="2"
				fill="#3C5597"
				opacity="0.18"
			/>

			{/* plant */}
			<path d="M28 152 q-6 -16 2 -26 q6 8 2 22 z" fill="#3C5597" />
			<path d="M32 152 q8 -14 18 -14 q-4 12 -16 16 z" fill="#26428B" />
			<rect x="26" y="150" width="20" height="8" rx="2" fill="#1C3259" />

			{/* person */}
			<rect x="49" y="120" width="9" height="34" rx="4.5" fill="#1C3259" />
			<rect x="62" y="120" width="9" height="34" rx="4.5" fill="#1C3259" />
			<ellipse cx="52" cy="155" rx="7" ry="3.5" fill="#0F1B33" />
			<ellipse cx="67" cy="155" rx="7" ry="3.5" fill="#0F1B33" />
			<rect x="45" y="92" width="31" height="34" rx="11" fill="#26428B" />
			<rect x="45" y="100" width="9" height="24" rx="4.5" fill="#3C5597" />
			<circle cx="60" cy="80" r="11" fill="#F4C6A8" />
			<path
				d="M49 79 a11 11 0 0 1 22 -1 q-3 -6 -11 -6 q-9 0 -11 7 z"
				fill="#2B2F45"
			/>
			{/* raised arm holding roller */}
			<path
				d="M70 98 L104 78"
				stroke="#3C5597"
				strokeWidth="8"
				strokeLinecap="round"
			/>
			<circle cx="105" cy="77" r="4.5" fill="#F4C6A8" />
			<path
				d="M106 76 L118 70"
				stroke="#1C3259"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<rect x="115" y="60" width="9" height="24" rx="4" fill="#1C3259" />
			<rect x="117" y="62" width="5" height="20" rx="2.5" fill="#3C5597" />
		</svg>
	);
}
