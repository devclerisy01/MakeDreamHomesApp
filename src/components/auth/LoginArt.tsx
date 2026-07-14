/**
 * Decorative house + location-pin scene shown at the bottom of the login popup,
 * matching the shared design: a centered cottage under a dotted arc, soft pines
 * and bushes, faint city towers, and a large location pin to the right. Flat,
 * light-blue monochrome; purely ornamental (aria-hidden, non-interactive).
 */
export function LoginArt({ className = "" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 393 200"
			className={className}
			aria-hidden="true"
			focusable="false"
			preserveAspectRatio="xMidYMax meet"
		>
			<defs>
				<linearGradient id="mdh-pin" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#b3c4ec" />
					<stop offset="1" stopColor="#8aa0dd" />
				</linearGradient>
			</defs>

			{/* faint city towers (far right, behind the pin) */}
			<g fill="#d8e1f6">
				<rect x="332" y="96" width="28" height="104" rx="4" />
				<rect x="364" y="120" width="24" height="80" rx="4" />
			</g>
			<g fill="#c4d2f0">
				<rect x="339" y="106" width="6" height="8" rx="1" />
				<rect x="349" y="106" width="6" height="8" rx="1" />
				<rect x="339" y="122" width="6" height="8" rx="1" />
				<rect x="349" y="122" width="6" height="8" rx="1" />
			</g>

			{/* dotted arc over the scene */}
			<path
				d="M58 150 Q 196 64 330 104"
				fill="none"
				stroke="#b3c4ec"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeDasharray="0.5 13"
			/>

			{/* ground */}
			<rect x="0" y="185" width="393" height="15" fill="#e6ecfa" />

			{/* left bush */}
			<g fill="#cbd8f4">
				<circle cx="18" cy="184" r="26" />
				<circle cx="50" cy="188" r="17" />
			</g>

			{/* pines (left of the house) */}
			<g transform="translate(104 185)">
				<rect x="-4" y="-9" width="8" height="14" rx="2" fill="#c9d6f3" />
				<polygon points="0,-60 22,-22 -22,-22" fill="#b0c1ea" />
				<polygon points="0,-46 18,-9 -18,-9" fill="#c4d2f0" />
			</g>
			<g transform="translate(138 185)">
				<rect x="-3" y="-7" width="6" height="11" rx="2" fill="#c9d6f3" />
				<polygon points="0,-44 15,-16 -15,-16" fill="#b0c1ea" />
				<polygon points="0,-33 12,-6 -12,-6" fill="#c4d2f0" />
			</g>

			{/* house (centered cottage) */}
			<g>
				{/* chimney (behind the roof) */}
				<rect x="171" y="84" width="11" height="30" rx="1.5" fill="#9db2e3" />
				{/* body */}
				<rect
					x="151"
					y="120"
					width="90"
					height="65"
					rx="3"
					fill="#f5f8fe"
					stroke="#d0dbf4"
					strokeWidth="2"
				/>
				{/* roof */}
				<polygon points="196,72 254,124 138,124" fill="#aebfe8" />
				<rect x="136" y="120" width="120" height="7" rx="3" fill="#9db2e3" />
				{/* door (arched) */}
				<path d="M186 185 V158 a10 10 0 0 1 20 0 V185 Z" fill="#a9bce9" />
				<circle cx="201" cy="172" r="1.8" fill="#eef3fc" />
				{/* windows (4-pane) */}
				<g>
					<rect x="159" y="134" width="22" height="22" rx="2" fill="#dfe8fa" />
					<rect x="211" y="134" width="22" height="22" rx="2" fill="#dfe8fa" />
				</g>
				<g stroke="#aebfe8" strokeWidth="1.6">
					<path d="M170 134V156M159 145H181" />
					<path d="M222 134V156M211 145H233" />
				</g>
			</g>

			{/* small pine between house and pin */}
			<g transform="translate(258 185)">
				<rect x="-3" y="-7" width="6" height="11" rx="2" fill="#c9d6f3" />
				<polygon points="0,-40 14,-14 -14,-14" fill="#b0c1ea" />
				<polygon points="0,-30 11,-5 -11,-5" fill="#c4d2f0" />
			</g>

			{/* location pin (right, prominent) */}
			<g transform="translate(301 186)">
				<ellipse cx="0" cy="3" rx="15" ry="4.5" fill="#c4d2f0" opacity="0.7" />
				<path
					d="M0 0 C-15 -22 -27 -35 -27 -54 a27 27 0 1 1 54 0 C27 -35 15 -22 0 0 Z"
					fill="url(#mdh-pin)"
				/>
				<circle cx="0" cy="-54" r="11" fill="#eef3fc" />
			</g>
		</svg>
	);
}
