import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";

import { LoginModal } from "@/components/auth/LoginModal";
import { isLoggedIn } from "@/lib/auth/session";

interface OpenLoginOptions {
	/** Pre-fill the phone the user already typed. */
	phone?: string;
	/** Runs once the user is signed in — immediately if already authed, else
	 *  after the popup login succeeds. Use it to resume a gated action in place. */
	onAuthenticated?: () => void;
}

interface LoginGateValue {
	/** Open the sign-in popup (no-op'd to an immediate callback if already authed). */
	openLogin: (options?: OpenLoginOptions) => void;
}

const LoginGateContext = createContext<LoginGateValue | null>(null);

/**
 * App-level sign-in popup gate. Exposes `openLogin` so any screen can prompt the
 * user to sign in *in place* (mirrors the web login dropdown) and resume a gated
 * action via `onAuthenticated`, instead of navigating to a separate login page.
 */
export function LoginGateProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<{ open: boolean; phone?: string }>({
		open: false,
	});
	// Held in a ref so opening/closing doesn't drop the pending callback.
	const onAuthedRef = useRef<(() => void) | undefined>(undefined);

	const openLogin = useCallback((options?: OpenLoginOptions) => {
		// Already signed in → run the gated action now; nothing to prompt.
		if (isLoggedIn()) {
			options?.onAuthenticated?.();
			return;
		}
		onAuthedRef.current = options?.onAuthenticated;
		setState({ open: true, phone: options?.phone });
	}, []);

	const close = useCallback(() => {
		onAuthedRef.current = undefined;
		setState({ open: false });
	}, []);

	return (
		<LoginGateContext.Provider value={{ openLogin }}>
			{children}
			<LoginModal
				isOpen={state.open}
				initialPhone={state.phone}
				onClose={close}
				onAuthenticated={() => {
					const cb = onAuthedRef.current;
					onAuthedRef.current = undefined;
					setState({ open: false });
					cb?.();
				}}
			/>
		</LoginGateContext.Provider>
	);
}

// Provider + its hook live together (like the web's login gate); the hook export
// is intentional and safe here.
// eslint-disable-next-line react-refresh/only-export-components
export function useLogin(): LoginGateValue {
	const ctx = useContext(LoginGateContext);
	if (!ctx) throw new Error("useLogin must be used within a LoginGateProvider");
	return ctx;
}
