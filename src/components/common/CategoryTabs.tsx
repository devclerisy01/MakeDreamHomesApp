interface CategoryTabsProps<T extends string> {
	tabs: { id: T; label: string }[];
	active: T;
	onChange: (id: T) => void;
}

/** Horizontal, scrollable pill tabs. Active pill is filled with the brand color. */
export function CategoryTabs<T extends string>({
	tabs,
	active,
	onChange,
}: CategoryTabsProps<T>) {
	return (
		<div className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					type="button"
					aria-pressed={tab.id === active}
					onClick={() => onChange(tab.id)}
					className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold ${
						tab.id === active
							? "border-primary bg-primary text-white"
							: "border-line bg-white text-muted"
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
