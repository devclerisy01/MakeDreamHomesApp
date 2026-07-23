import {
	IonHeader,
	IonIcon,
	IonToolbar,
	useIonActionSheet,
	useIonRouter,
} from "@ionic/react";
import { useEffect, useState } from "react";

import { CityPickerModal } from "@/components/location/CityPickerModal";
import { ROUTES } from "@/constants/routes";
import { localeLabel } from "@/i18n/config";
import { type CityOption } from "@/lib/api/locations";
import {
	getVerifiedCitiesCached,
	setLocation,
	useSelectedLocation,
} from "@/lib/geo/location-store";
import { getLanguageOptions, type LanguageOption } from "@/lib/i18n/languages";
import { setLocale, useSelectedLocale } from "@/lib/i18n/locale-store";
import { ICONS } from "@/theme/icons";

interface AppHeaderProps {
	title?: string;
	/** Render the brand wordmark instead of a title (Home). */
	showLogo?: boolean;
	/** Show a back chevron (for pushed sub-pages). */
	back?: boolean;
	/** Blend the toolbar into the Home page's light-blue gradient backdrop. */
	tinted?: boolean;
	/** Show the location (city) picker pill — on for listing surfaces. */
	showLocation?: boolean;
}

/**
 * Shared top bar: an optional leading back button (pushed sub-pages), the
 * title/logo, the location city picker and the language selector.
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
	const lang = useSelectedLocale();
	const [pickerOpen, setPickerOpen] = useState(false);
	const [cities, setCities] = useState<CityOption[]>([]);
	const [languages, setLanguages] = useState<LanguageOption[]>([]);
	const [presentLangSheet] = useIonActionSheet();
	// Label for the active locale — from the fetched list, falling back to the
	// code's native name (or the raw code) until the list loads.
	const activeLang =
		languages.find((l) => l.code === lang)?.label ?? localeLabel(lang, lang);

	// Load the active languages once (module-cached in the service, so cheap
	// across every header instance).
	useEffect(() => {
		let alive = true;
		void getLanguageOptions().then((list) => {
			if (alive) setLanguages(list);
		});
		return () => {
			alive = false;
		};
	}, []);

	function openLanguageSheet() {
		presentLangSheet({
			mode: "ios",
			header: "Language",
			cssClass: "mdh-lang-sheet",
			buttons: [
				...languages.map((l) => ({
					text: l.label,
					role: l.code === lang ? "selected" : undefined,
					handler: () => setLocale(l.code),
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
				<div className="flex items-center gap-2 px-5 py-1">
					{back ? (
						<button
							className="cursor-pointer border-none bg-transparent p-1.5 leading-none text-ink -ml-3 -mr-1 relative top-[1px]"
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
					) : null}

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

					<div className="flex items-center gap-2">
						{showLocation ? (
							<button
								type="button"
								onClick={() => setPickerOpen(true)}
								aria-label="Change location"
								className="group inline-flex max-w-[130px] items-center gap-1.5 whitespace-nowrap rounded-full bg-white py-1.5 pl-1.5 pr-2.5 text-[11.5px] font-semibold text-ink shadow-[0_2px_8px_rgba(16,24,40,0.08)] ring-1 ring-black/[0.04] transition active:scale-[0.97]"
							>
								<span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
									<IonIcon icon={ICONS.location} className="text-[12px]" />
								</span>
								<span className="min-w-0 flex-1 truncate">
									{location?.city ?? "Select city"}
								</span>
								<IonIcon
									icon={ICONS.chevronDown}
									className="shrink-0 text-[9px] text-muted-light"
								/>
							</button>
						) : null}
						<button
							type="button"
							onClick={openLanguageSheet}
							aria-label="Change language"
							className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white py-1.5 pl-1.5 pr-2.5 text-[11.5px] font-semibold text-ink shadow-[0_2px_8px_rgba(16,24,40,0.08)] ring-1 ring-black/[0.04] transition active:scale-[0.97]"
						>
							<span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
								<IonIcon icon={ICONS.language} className="text-[12px]" />
							</span>
							{activeLang}
							<IonIcon
								icon={ICONS.chevronDown}
								className="shrink-0 text-[9px] text-muted-light"
							/>
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
