import { IonHeader, IonIcon, IonToolbar, useIonRouter } from "@ionic/react";

import { ROUTES } from "@/constants/routes";
import { ICONS } from "@/theme/icons";

interface AppHeaderProps {
	title?: string;
	/** Render the brand wordmark instead of a title (Home). */
	showLogo?: boolean;
	/** Show a back chevron (for pushed sub-pages) instead of the menu button. */
	back?: boolean;
	/** Blend the toolbar into the Home page's light-blue gradient backdrop. */
	tinted?: boolean;
}

/**
 * Shared top bar: leading menu/back button, title/logo, language selector +
 * notification bell. Menu, language and notifications are display-only in
 * Phase 1.
 */
export function AppHeader({
	title,
	showLogo = false,
	back = false,
	tinted = false,
}: AppHeaderProps) {
	const router = useIonRouter();

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
						<button
							className="cursor-pointer border-none bg-transparent p-1.5 leading-none text-ink"
							type="button"
							aria-label="Menu"
						>
							<IonIcon icon={ICONS.menu} className="text-[20px]" />
						</button>
					)}

					<div className="min-w-0 flex-1">
						{showLogo ? (
							<img
								src="/logo.svg"
								alt="MakeDreamHomes"
								className="h-[26px] w-auto"
							/>
						) : (
							<h1 className="m-0 truncate text-[19px] font-extrabold text-ink">
								{title}
							</h1>
						)}
					</div>

					<div className="flex items-center gap-1.5">
						<button
							className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink"
							type="button"
						>
							<IonIcon
								icon={ICONS.language}
								className="text-[13px] text-muted-light"
							/>
							English
							<IonIcon icon={ICONS.chevronDown} className="text-[10px]" />
						</button>
						<button
							className="cursor-pointer border-none bg-transparent p-1 leading-none text-ink"
							type="button"
							aria-label="Notifications"
						>
							<IonIcon icon={ICONS.notifications} className="text-xl" />
						</button>
					</div>
				</div>
			</IonToolbar>
		</IonHeader>
	);
}
