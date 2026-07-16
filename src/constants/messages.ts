/**
 * Single source of truth for the app's LOCAL (non-API) toast strings — the
 * validation nudges, capability notices and client-side failures that don't
 * come from an API response envelope. API messages are resolved centrally in
 * `lib/api/messages.ts`; these are their local counterpart. Mirrors the web's
 * message map and capExpert's `core/messages.ts`.
 *
 * Show them through the common `toastSuccess` / `toastError` / `toastInfo`
 * helpers in `lib/api/toast.ts` — never `useIonToast` directly.
 */
export const UI_MESSAGES = {
	// images / uploads
	imageOnly: "Please choose an image file.",
	imageTooLarge: "Image must be 5 MB or smaller.",
	photoUploadFailed: "Couldn't upload the photo. Try again.",
	photosUploadFailed: "Couldn't upload your photos. Please try again.",
	imagesUploadFailed: "Couldn't upload your images. Please try again.",

	// capability / device
	voiceUnavailable: "Voice input isn't available on this device.",
	locationUnavailable: "Location isn't available on this device.",
	locationFailed: "Couldn't determine your location. Enter it manually.",
	locationDenied: "Location permission denied. Please enter it manually.",

	// auth
	numberRegistered: "This number already has an account. Please sign in.",
	notRegistered: "This number isn't registered. Let's create your account.",
	accountCreated: "Account created successfully.",
	signedIn: "Signed in successfully.",
	codeSent: "A new code has been sent.",
	codeResendFailed: "Couldn't resend the code. Try again shortly.",

	// reviews / profile validation
	rateEveryCategory: "Please rate every category.",
	commentTooShort: "Your comment should be at least 20 characters.",
	reraRequired: "Please enter your RERA number.",
	productRequired: "Select at least one product category.",

	// shortlist
	saveFailed: "Couldn't update. Try again.",

	/** "<Feature> is coming soon." */
	comingSoon: (what: string) => `${what} is coming soon.`,
} as const;
