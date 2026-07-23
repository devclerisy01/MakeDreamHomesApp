import { useTranslations } from "use-intl";

interface CategoryTabsProps<T extends string> {
	tabs: { id: T; labelKey: string }[];
	active: T;
	onChange: (id: T) => void;
}

/** Horizontal, scrollable pill tabs. Active pill is filled with the brand color. */
export function CategoryTabs<T extends string>({
	tabs,
	active,
	onChange,
}: CategoryTabsProps<T>) {
	const translate = useTranslations();
	return (
		<div className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					type="button"
					aria-pressed={tab.id === active}
					onClick={() => onChange(tab.id)}
					className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-medium ${
						tab.id === active
							? "bg-primary text-white"
							: "bg-white text-[#777] shadow-[0_1px_2.4px_rgba(0,0,0,0.17)]"
					}`}
				>
					{translate(tab.labelKey)}
				</button>
			))}
		</div>
	);
}
