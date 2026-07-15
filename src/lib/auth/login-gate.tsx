import { IonContent, IonModal } from "@ionic/react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";

import { LoginPanel } from "@/components/auth/LoginModal";
import { SignupPanel } from "@/components/auth/SignupModal";
import { isLoggedIn } from "@/lib/auth/session";

interface OpenAuthOptions {
	/** Pre-fill the phone the user already typed. */
	phone?: string;
	/** Runs once the user is signed in — immediately if already authed, else
	 *  after the popup login/sign-up succeeds. Use it to resume a gated action. */
	onAuthenticated?: () => void;
}

interface LoginGateValue {
	/** Open the sign-in popup (no-op'd to an immediate callback if already authed). */
	openLogin: (options?: OpenAuthOptions) => void;
	/** Open the create-account popup (same behaviour as {@link openLogin}). */
	openSignup: (options?: OpenAuthOptions) => void;
}

const LoginGateContext = createContext<LoginGateValue | null>(null);

type Mode = "login" | "signup" | null;

/**
 * App-level auth popup gate. Exposes `openLogin` / `openSignup` so any screen can
 * prompt the user *in place* (mirrors the web login dropdown) and resume a gated
 * action via `onAuthenticated`, instead of navigating to a separate page. Both
 * live in ONE bottom-sheet whose content swaps between the login and sign-up
 * panels — so switching never races Ionic's dismiss/present animations.
 */
export function LoginGateProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<{ mode: Mode; phone?: string }>({
		mode: null,
	});
	// Held in a ref so opening/switching doesn't drop the pending callback.
	const onAuthedRef = useRef<(() => void) | undefined>(undefined);

	const open = useCallback(
		(mode: Exclude<Mode, null>, options?: OpenAuthOptions) => {
			// Already signed in → run the gated action now; nothing to prompt.
			if (isLoggedIn()) {
				options?.onAuthenticated?.();
				return;
			}
			onAuthedRef.current = options?.onAuthenticated;
			setState({ mode, phone: options?.phone });
		},
		[],
	);

	const openLogin = useCallback(
		(options?: OpenAuthOptions) => open("login", options),
		[open],
	);
	const openSignup = useCallback(
		(options?: OpenAuthOptions) => open("signup", options),
		[open],
	);

	const close = useCallback(() => {
		onAuthedRef.current = undefined;
		setState({ mode: null });
	}, []);

	// Success: close, then resume the gated action.
	const authenticated = useCallback(() => {
		const cb = onAuthedRef.current;
		onAuthedRef.current = undefined;
		setState({ mode: null });
		cb?.();
	}, []);

	// Swap panels inside the same sheet, carrying the typed phone over and KEEPING
	// the pending `onAuthenticated` so the gated action still resumes after either.
	const switchTo = useCallback(
		(mode: Exclude<Mode, null>) => (phone: string) => setState({ mode, phone }),
		[],
	);

	return (
		<LoginGateContext.Provider value={{ openLogin, openSignup }}>
			{children}
			<IonModal
				isOpen={state.mode !== null}
				onDidDismiss={close}
				initialBreakpoint={1}
				breakpoints={[0, 1]}
			>
				<IonContent
					style={{
						"--background":
							"linear-gradient(180deg,#e8f3fc 0%,#f6f7fb 45%,#f6f7fb 100%)",
					}}
				>
					{/* Decorative house/pin scene anchored to the bottom (matches design):
					   the exported artwork, rendered faintly and faded into the page. */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[190px] overflow-hidden"
					>
						<img
							src="/auth-scene.png"
							alt=""
							className="absolute bottom-0 left-0 w-full opacity-[0.45]"
						/>
						<div className="absolute inset-0 bg-gradient-to-b from-[#f2f7fe] via-[#f2f7fe]/50 to-transparent" />
					</div>

					<div className="relative z-10 mx-auto flex min-h-full w-full max-w-[460px] flex-col px-6 pb-[210px] pt-[calc(env(safe-area-inset-top)+1rem)]">
						{state.mode === "signup" ? (
							<SignupPanel
								initialPhone={state.phone}
								onClose={close}
								onAuthenticated={authenticated}
								onSwitchToLogin={switchTo("login")}
							/>
						) : state.mode === "login" ? (
							<LoginPanel
								initialPhone={state.phone}
								onClose={close}
								onAuthenticated={authenticated}
								onSwitchToSignup={switchTo("signup")}
							/>
						) : null}
					</div>
				</IonContent>
			</IonModal>
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
