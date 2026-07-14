import { IonIcon, useIonRouter, useIonToast } from "@ionic/react";
import { heart, heartOutline } from "ionicons/icons";
import { type MouseEvent, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { loginHref } from "@/constants/routes";
import {
	cachedShortlistIds,
	getShortlistedIds,
	toggleSave,
} from "@/lib/api/shortlists";
import { isLoggedIn } from "@/lib/auth/session";
import type { ShortlistEntity } from "@/types";

interface SaveButtonProps {
	entityType: ShortlistEntity;
	entityId: string;
	/** Fired after a successful toggle with the new saved state. */
	onToggle?: (saved: boolean) => void;
}

/**
 * Heart toggle for cards. Seeds its filled/empty state from the signed-in
 * user's saved set (cached), toggles via the API, and gates on auth (logged-out
 * taps route to the login screen). Stops event propagation so tapping it never
 * triggers the card's navigation.
 */
export function SaveButton({
	entityType,
	entityId,
	onToggle,
}: SaveButtonProps) {
	const [saved, setSaved] = useState(() =>
		cachedShortlistIds(entityType).includes(String(entityId)),
	);
	const [busy, setBusy] = useState(false);
	const [present] = useIonToast();
	const router = useIonRouter();
	const { pathname, search } = useLocation();

	// Seed the real saved state from the user's shortlist (one shared fetch).
	useEffect(() => {
		if (!isLoggedIn()) return;
		let alive = true;
		void getShortlistedIds(entityType).then((ids) => {
			if (alive) setSaved(ids.includes(String(entityId)));
		});
		return () => {
			alive = false;
		};
	}, [entityType, entityId]);

	const onClick = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (!isLoggedIn()) {
			void present({
				message: "Please sign in to save.",
				duration: 1600,
				position: "bottom",
			});
			router.push(
				loginHref({ returnTo: `${pathname}${search}` }),
				"forward",
				"push",
			);
			return;
		}
		if (busy) return;
		setBusy(true);
		const next = !saved;
		setSaved(next);
		try {
			const result = await toggleSave(entityType, entityId);
			setSaved(result);
			onToggle?.(result);
		} catch {
			setSaved(!next);
			void present({
				message: "Couldn't update. Try again.",
				duration: 1800,
				position: "bottom",
				color: "danger",
			});
		} finally {
			setBusy(false);
		}
	};

	return (
		<button
			type="button"
			className={`shrink-0 cursor-pointer border-none bg-transparent p-1 leading-none ${
				saved ? "text-danger" : "text-muted-light"
			}`}
			aria-label={saved ? "Remove from saved" : "Save"}
			aria-pressed={saved}
			onClick={onClick}
		>
			<IonIcon icon={saved ? heart : heartOutline} className="text-[20px]" />
		</button>
	);
}
