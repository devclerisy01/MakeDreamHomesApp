import { useEffect, useState } from "react";
import {
	IntlProvider as UseIntlProvider,
	type IntlError,
	IntlErrorCode,
} from "use-intl";

import { defaultTimeZone } from "@/i18n/config";
import { getMessagesForLocale, type Messages } from "@/lib/i18n/catalogue";
import { useSelectedLocale } from "@/lib/i18n/locale-store";

/**
 * Swallow missing-message / missing-format errors in production (a key not yet
 * translated should fall back to the key, not spam the console); surface
 * everything in development. Mirrors the web's `i18n/intl-error.ts`.
 */
const isProd = import.meta.env.PROD;
function onError(error: IntlError): void {
	if (
		isProd &&
		(error.code === IntlErrorCode.MISSING_MESSAGE ||
			error.code === IntlErrorCode.MISSING_FORMAT)
	) {
		return;
	}
	console.error(error);
}

/**
 * Loads the active locale's catalogue from the API and provides it to the tree
 * via use-intl. The locale comes from the persisted `locale-store`; changing it
 * (via the header switcher) refetches and swaps the catalogue.
 *
 * First paint is gated until the initial catalogue resolves (the branded splash
 * in `main.tsx` covers this). On a later locale switch the previous catalogue is
 * kept until the new one arrives, so the UI never blanks mid-session.
 */
export function IntlProvider({ children }: { children: React.ReactNode }) {
	const locale = useSelectedLocale();
	const [messages, setMessages] = useState<Messages | null>(null);

	useEffect(() => {
		let active = true;
		void getMessagesForLocale(locale).then((next) => {
			if (active) setMessages(next);
		});
		return () => {
			active = false;
		};
	}, [locale]);

	// Before the very first catalogue loads there is nothing to render text with;
	// the splash overlay is on screen, so render nothing rather than a flash of
	// raw keys. (On a locale switch `messages` is non-null and kept until swap.)
	if (messages === null) return null;

	return (
		<UseIntlProvider
			locale={locale}
			messages={messages}
			timeZone={defaultTimeZone}
			onError={onError}
		>
			{children}
		</UseIntlProvider>
	);
}
