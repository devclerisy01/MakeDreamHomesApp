import { IonHeader, IonIcon, IonToolbar, useIonRouter } from "@ionic/react";
import {
	chevronBackOutline,
	chevronDownOutline,
	globeOutline,
	menuOutline,
	notificationsOutline,
} from "ionicons/icons";

import { ROUTES } from "@/constants/routes";

interface AppHeaderProps {
	title?: string;
	/** Render the brand wordmark instead of a title (Home). */
	showLogo?: boolean;
	/** Show a back chevron (for pushed sub-pages) instead of the menu button. */
	back?: boolean;
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
}: AppHeaderProps) {
	const router = useIonRouter();

	return (
		<IonHeader className="mdh-header">
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
							<IonIcon icon={chevronBackOutline} className="text-2xl" />
						</button>
					) : (
						<button
							className="cursor-pointer border-none bg-transparent p-1.5 leading-none text-ink"
							type="button"
							aria-label="Menu"
						>
							<IonIcon icon={menuOutline} className="text-2xl" />
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
							className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-line bg-white px-2.5 py-1.5 text-[13px] font-semibold text-ink"
							type="button"
						>
							<IonIcon
								icon={globeOutline}
								className="text-[15px] text-muted-light"
							/>
							English
							<IonIcon icon={chevronDownOutline} className="text-xs" />
						</button>
						<button
							className="relative cursor-pointer border-none bg-transparent p-1.5 leading-none text-ink"
							type="button"
							aria-label="Notifications"
						>
							<IonIcon icon={notificationsOutline} className="text-2xl" />
							<span className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-primary" />
						</button>
					</div>
				</div>
			</IonToolbar>
		</IonHeader>
	);
}
