import {
	IonHeader,
	IonIcon,
	IonMenuToggle,
	IonToolbar,
	useIonActionSheet,
	useIonRouter,
} from "@ionic/react";
import { useEffect, useState } from "react";

import { CityPickerModal } from "@/components/location/CityPickerModal";
import { ROUTES } from "@/constants/routes";
import { type CityOption } from "@/lib/api/locations";
import {
	getVerifiedCitiesCached,
	setLocation,
	useSelectedLocation,
} from "@/lib/geo/location-store";
import { ICONS } from "@/theme/icons";

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "hi", label: "हिन्दी" },
	{ code: "pa", label: "ਪੰਜਾਬੀ" },
];

interface AppHeaderProps {
	title?: string;
	/** Render the brand wordmark instead of a title (Home). */
	showLogo?: boolean;
	/** Show a back chevron (for pushed sub-pages) instead of the menu button. */
	back?: boolean;
	/** Blend the toolbar into the Home page's light-blue gradient backdrop. */
	tinted?: boolean;
	/** Show the location (city) picker pill — on for listing surfaces. */
	showLocation?: boolean;
}

/**
 * Shared top bar: a leading back / "three bars" button (the menu button opens
 * the side drawer — see {@link ./SideMenu}), title/logo, the location city
 * picker and a static language indicator.
 */
export function AppHeader({
	title,
	showLogo = false,
	back = false,
	tinted = false,
	showLocation = false,
}: AppHeaderProps) {
	const router = useIonRouter();
	const location = useSelectedLocation();
	const [pickerOpen, setPickerOpen] = useState(false);
	const [cities, setCities] = useState<CityOption[]>([]);
	const [lang, setLang] = useState("en");
	const [presentLangSheet] = useIonActionSheet();
	const activeLang = LANGUAGES.find((l) => l.code === lang)?.label ?? "English";

	function openLanguageSheet() {
		presentLangSheet({
			mode: "ios",
			header: "Language",
			cssClass: "mdh-lang-sheet",
			buttons: [
				...LANGUAGES.map((l) => ({
					text: l.label,
					role: l.code === lang ? "selected" : undefined,
					handler: () => setLang(l.code),
				})),
				{
					text: "Cancel",
					role: "cancel" as const,
					cssClass: "mdh-sheet-cancel",
				},
			],
		});
	}

	// Load verified cities once, the first time the picker opens (module-cached,
	// so it's cheap across every page's header instance).
	useEffect(() => {
		if (!pickerOpen || cities.length) return;
		let alive = true;
		void getVerifiedCitiesCached().then((c) => {
			if (alive) setCities(c);
		});
		return () => {
			alive = false;
		};
	}, [pickerOpen, cities.length]);

	return (
		<IonHeader className={`mdh-header${tinted ? " mdh-header--tint" : ""}`}>
			<IonToolbar>
				<div className="flex items-center gap-2 px-2.5 py-1">
					{back ? (
						<button
							className="cursor-pointer border-none bg-transparent p-1.5 leading-none text-ink"
							type="button"
							aria-label="Back"
							onClick={() =>
								router.canGoBack()
									? router.goBack()
									: router.push(ROUTES.home, "root", "replace")
							}
						>
							<IonIcon icon={ICONS.back} className="text-2xl" />
						</button>
					) : (
						// Opens the side drawer (SideMenu) with the account action.
						<IonMenuToggle menu="app-menu" autoHide={false}>
							<button
								className="cursor-pointer border-none bg-transparent p-1.5 leading-none text-ink"
								type="button"
								aria-label="Menu"
							>
								<IonIcon icon={ICONS.menu} className="text-[20px]" />
							</button>
						</IonMenuToggle>
					)}

					<div className="min-w-0 flex-1">
						{showLogo ? (
							<img
								src="/logo.svg"
								alt="MakeDreamHomes"
								className="h-[26px] w-auto"
							/>
						) : (
							<h1 className="m-0 truncate text-base font-bold text-ink">
								{title}
							</h1>
						)}
					</div>

					<div className="flex items-center gap-1.5">
						{showLocation ? (
							<button
								type="button"
								onClick={() => setPickerOpen(true)}
								aria-label="Change location"
								className="inline-flex max-w-[120px] items-center gap-1 whitespace-nowrap rounded-full border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink"
							>
								<IonIcon
									icon={ICONS.location}
									className="shrink-0 text-[13px] text-muted-light"
								/>
								<span className="min-w-0 flex-1 truncate">
									{location?.city ?? "Select city"}
								</span>
								<IonIcon icon={ICONS.chevronDown} className="text-[10px]" />
							</button>
						) : null}
						<button
							type="button"
							onClick={openLanguageSheet}
							aria-label="Change language"
							className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink"
						>
							<IonIcon
								icon={ICONS.language}
								className="text-[13px] text-muted-light"
							/>
							{activeLang}
							<IonIcon icon={ICONS.chevronDown} className="text-[10px]" />
						</button>
					</div>
				</div>
			</IonToolbar>

			{showLocation ? (
				<CityPickerModal
					isOpen={pickerOpen}
					onClose={() => setPickerOpen(false)}
					cities={cities}
					value={location?.city}
					onSelect={(loc) => {
						setLocation(loc);
						setPickerOpen(false);
					}}
				/>
			) : null}
		</IonHeader>
	);
}
