import {
	IonContent,
	IonIcon,
	IonModal,
	IonPage,
	IonSpinner,
	useIonRouter,
} from "@ionic/react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { OtpVerify } from "@/components/auth/OtpVerify";
import { PHONE_DIGITS, PhoneField } from "@/components/auth/PhoneField";
import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { CategoryChips } from "@/components/common/CategoryChips";
import { TextField } from "@/components/common/TextField";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { UI_MESSAGES } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import {
	checkPhone,
	otpRegister,
	requestOtp,
	type RegisterInput,
} from "@/lib/api/auth";
import {
	createRequirement,
	type RequirementType,
	uploadLeadAttachment,
} from "@/lib/api/leads";
import {
	type CategoryOption,
	getMaterialCategories,
	getProfessionalCategories,
} from "@/lib/api/misc";
import type { AddressResult } from "@/lib/api/places";
import { toastError, toastInfo } from "@/lib/api/toast";
import { useLogin } from "@/lib/auth/login-gate";
import { storeSession, useAuth } from "@/lib/auth/session";
import { CARD } from "@/lib/ui";
import { ICONS } from "@/theme/icons";

type Intent = "buy" | "sell";
type ProIntent = "hire" | "available";

const OPTIONS: { type: RequirementType; label: string; icon: string }[] = [
	{
		type: "professional",
		label: "Professionals",
		icon: ICONS.reqProfessionals,
	},
	{ type: "property", label: "Buy / Sell Properties", icon: ICONS.reqProperty },
	{ type: "material", label: "Material Suppliers", icon: ICONS.reqMaterial },
];

const PRO_INTENTS: { value: ProIntent; label: string }[] = [
	{ value: "hire", label: "Hire a Professional" },
	{ value: "available", label: "I'm Available for Work" },
];

const PROPERTY_GROUPS = [
	{ value: "residential", label: "Residential" },
	{ value: "commercial", label: "Commercial Space" },
	{ value: "agriculture", label: "Agriculture" },
];
const RESIDENTIAL_TYPES = [
	{ value: "plot", label: "Plot" },
	{ value: "flat", label: "Flat" },
	{ value: "kothi", label: "Kothi" },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface SpeechRecognitionLike {
	lang: string;
	interimResults: boolean;
	continuous: boolean;
	start(): void;
	stop(): void;
	onresult: ((event: SpeechResultEvent) => void) | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
}
interface SpeechResultEvent {
	results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
type SpeechCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechCtor | null {
	const w = window as unknown as {
		SpeechRecognition?: SpeechCtor;
		webkitSpeechRecognition?: SpeechCtor;
	};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Attachment {
	file: File;
	url: string;
}

const CHIP =
	"rounded-full border px-[9px] py-1 text-[11px] font-semibold transition-colors";
const CHIP_ON = "border-primary bg-[#f5f7fb] text-primary";
const CHIP_OFF = "border-line bg-white text-muted";

/**
 * Post Your Requirement — mirrors the web post-requirement form's fields: a
 * track (Hire Professionals / Buy-Sell Property / Material Suppliers); the
 * professional hire-vs-available toggle; a buy/sell intent (property + material)
 * with sell-only image attachments; category chips + an "Other" free-text option
 * (professional + material) or a two-level property picker (group → type) plus a
 * society/commercial name; then description (typed or dictated), address and an
 * estimated price. Posts to `POST /app/leads` (same body the web sends). Posting
 * requires auth; logged-out users go to sign in.
 */
export default function Requirement() {
	const router = useIonRouter();
	const { isAuthed } = useAuth();
	const { openLogin } = useLogin();

	const [type, setType] = useState<RequirementType>("professional");
	const [proIntent, setProIntent] = useState<ProIntent>("hire");
	const [intent, setIntent] = useState<Intent>("buy");

	const [proCats, setProCats] = useState<number[]>([]);
	const [materialCats, setMaterialCats] = useState<number[]>([]);
	const [otherActive, setOtherActive] = useState(false);
	const [otherCategory, setOtherCategory] = useState("");

	const [propertyGroup, setPropertyGroup] = useState("");
	const [propertyType, setPropertyType] = useState("");
	const [placeName, setPlaceName] = useState("");

	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [fileError, setFileError] = useState<string | null>(null);

	const [description, setDescription] = useState("");
	const [address, setAddress] = useState("");
	// Structured parts from the last autocomplete selection; cleared on manual edit.
	const [addressMeta, setAddressMeta] = useState<AddressResult | null>(null);
	const [price, setPrice] = useState("");
	const [priceUnsure, setPriceUnsure] = useState(false);

	const [proOptions, setProOptions] = useState<CategoryOption[]>([]);
	const [materialOptions, setMaterialOptions] = useState<CategoryOption[]>([]);
	const [categoryError, setCategoryError] = useState<string | null>(null);
	const [descriptionError, setDescriptionError] = useState<string | null>(null);
	const [addressError, setAddressError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [listening, setListening] = useState(false);
	const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
	const attachmentsRef = useRef<Attachment[]>([]);
	attachmentsRef.current = attachments;

	// Guest (logged-out) inline sign-up: name + phone → OTP → account, then post.
	const [phone, setPhone] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [phoneError, setPhoneError] = useState<string | null>(null);
	const [nameError, setNameError] = useState<string | null>(null);
	const [otpOpen, setOtpOpen] = useState(false);
	const [verificationId, setVerificationId] = useState("");
	const [resendAfter, setResendAfter] = useState(60);
	const [otpError, setOtpError] = useState<string | null>(null);
	const [verifying, setVerifying] = useState(false);

	// Attachments apply only to "sell" property/material requirements.
	const showAttachment = type !== "professional" && intent === "sell";

	useEffect(() => {
		const controller = new AbortController();
		getProfessionalCategories(controller.signal)
			.then(setProOptions)
			.catch(() => {});
		getMaterialCategories(controller.signal)
			.then(setMaterialOptions)
			.catch(() => {});
		return () => {
			controller.abort();
			recognitionRef.current?.stop();
			for (const item of attachmentsRef.current) URL.revokeObjectURL(item.url);
		};
	}, []);

	// Drop staged attachments when the section hides (track/intent change).
	useEffect(() => {
		if (showAttachment) return;
		setAttachments((prev) => {
			for (const item of prev) URL.revokeObjectURL(item.url);
			return prev.length ? [] : prev;
		});
		setFileError(null);
	}, [showAttachment]);

	function chooseType(next: RequirementType) {
		setType(next);
		setCategoryError(null);
		// Switching track clears any track-specific selections + the "Other"
		// buffer so stale picks/text don't carry across (mirrors the web).
		setProCats([]);
		setMaterialCats([]);
		setOtherActive(false);
		setOtherCategory("");
		setPropertyGroup("");
		setPropertyType("");
		setPlaceName("");
	}

	/** Switch hire↔available; clears the professional picks + "Other" buffer. */
	function chooseProIntent(next: ProIntent) {
		setProIntent(next);
		setCategoryError(null);
		setProCats([]);
		setOtherActive(false);
		setOtherCategory("");
	}

	function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
		const picked = Array.from(event.target.files ?? []);
		event.target.value = "";
		let error: string | null = null;
		const next = [...attachments];
		for (const file of picked) {
			if (next.length >= MAX_FILES) {
				error = `You can add up to ${MAX_FILES} images`;
				break;
			}
			if (!file.type.startsWith("image/")) {
				error = "Only image files are allowed";
				continue;
			}
			if (file.size > MAX_FILE_SIZE) {
				error = "Each image must be 5 MB or smaller";
				continue;
			}
			if (
				next.some((a) => a.file.name === file.name && a.file.size === file.size)
			) {
				continue;
			}
			next.push({ file, url: URL.createObjectURL(file) });
		}
		setAttachments(next);
		setFileError(error);
	}

	function removeAttachment(index: number) {
		setAttachments((prev) => {
			const item = prev[index];
			if (item) URL.revokeObjectURL(item.url);
			return prev.filter((_, i) => i !== index);
		});
		setFileError(null);
	}

	function toggleSpeech() {
		const SpeechRecognition = getSpeechRecognition();
		if (!SpeechRecognition) {
			toastInfo(UI_MESSAGES.voiceUnavailable);
			return;
		}
		if (listening) {
			recognitionRef.current?.stop();
			return;
		}
		const recognition = new SpeechRecognition();
		recognition.lang = "en-IN";
		recognition.interimResults = false;
		recognition.continuous = false;
		recognition.onresult = (event) => {
			const transcript = Array.from(event.results)
				.map((result) => result[0]?.transcript ?? "")
				.join(" ")
				.trim();
			if (transcript) {
				setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
				if (descriptionError) setDescriptionError(null);
			}
		};
		recognition.onend = () => setListening(false);
		recognition.onerror = () => setListening(false);
		recognitionRef.current = recognition;
		setListening(true);
		recognition.start();
	}

	function selectedCategoryNames(): string[] {
		const ids = type === "professional" ? proCats : materialCats;
		const options = type === "professional" ? proOptions : materialOptions;
		const names = ids
			.map((id) => options.find((option) => option.id === id)?.value)
			.filter((value): value is string => Boolean(value));
		if (otherActive && otherCategory.trim()) names.push(otherCategory.trim());
		return names;
	}

	function resetForm() {
		setDescription("");
		setAddress("");
		setAddressMeta(null);
		setPrice("");
		setPriceUnsure(false);
		setProCats([]);
		setMaterialCats([]);
		setOtherActive(false);
		setOtherCategory("");
		setPropertyGroup("");
		setPropertyType("");
		setPlaceName("");
		for (const item of attachments) URL.revokeObjectURL(item.url);
		setAttachments([]);
	}

	// Which member type a guest is registered as, derived from the requirement — a
	// "sell material" post makes them a supplier, an "available for work"
	// professional post a professional, everything else a plain person (like web).
	const signupUserType: RegisterInput["userType"] =
		type === "material" && intent === "sell"
			? "supplier"
			: type === "professional" && proIntent === "available"
				? "professional"
				: "person";

	/** Validate the shared requirement fields (category + description). */
	function validateRequirement(): boolean {
		let invalid = false;
		if (type === "professional" || type === "material") {
			if (selectedCategoryNames().length === 0) {
				setCategoryError(
					type === "professional"
						? "Select at least one professional (or add your own)."
						: "Select at least one material category (or add your own).",
				);
				invalid = true;
			}
		} else if (!propertyGroup) {
			setCategoryError("Select a property category.");
			invalid = true;
		} else if (propertyGroup === "residential" && !propertyType) {
			setCategoryError("Select a property type.");
			invalid = true;
		}
		if (description.trim().length < 20) {
			setDescriptionError(
				"Please describe your requirement in at least 20 characters.",
			);
			invalid = true;
		}
		if (!(addressMeta?.address || address).trim()) {
			setAddressError("Please add your location.");
			invalid = true;
		}
		return !invalid;
	}

	/** Upload attachments and create the lead — for a logged-in post, or right
	 *  after a guest signs up via OTP. */
	async function postRequirement() {
		setSubmitting(true);
		try {
			let imageUrl: string | undefined;
			if (showAttachment && attachments.length > 0) {
				try {
					const keys = await Promise.all(
						attachments.map((item) => uploadLeadAttachment(item.file)),
					);
					imageUrl = keys.join(",");
				} catch {
					// The S3 PUT isn't routed through the API client, so it isn't
					// auto-toasted — surface the failure here and stop.
					toastError(UI_MESSAGES.imagesUploadFailed);
					return;
				}
			}
			await createRequirement({
				type,
				intent: type === "professional" ? undefined : intent,
				proIntent: type === "professional" ? proIntent : undefined,
				categories: type === "property" ? undefined : selectedCategoryNames(),
				propertyGroup: type === "property" ? propertyGroup : undefined,
				propertyType: type === "property" ? propertyType : undefined,
				placeName:
					type === "property" && intent === "sell" ? placeName : undefined,
				description,
				address: addressMeta?.address || address,
				locality: addressMeta?.locality,
				city: addressMeta?.city,
				state: addressMeta?.state,
				pincode: addressMeta?.pincode,
				latitude: addressMeta?.latitude,
				longitude: addressMeta?.longitude,
				price: priceUnsure ? "" : price,
				imageUrl,
			});
			// Success is toasted centrally (leads.requirementSubmitted).
			resetForm();
			// Show the user their own leads after posting (mirrors the web, which
			// lands on the "My Leads" view); mobile surfaces them on the profile.
			router.push(ROUTES.profile, "root");
		} catch {
			// createRequirement failures are toasted centrally; nothing to add.
		} finally {
			setSubmitting(false);
		}
	}

	async function submit() {
		if (!validateRequirement()) return;

		// Signed in → post straight away.
		if (isAuthed) {
			void postRequirement();
			return;
		}

		// Guest → validate their details, then start the inline OTP sign-up.
		let invalid = false;
		if (!firstName.trim()) {
			setNameError("Please enter your first name.");
			invalid = true;
		}
		if (phone.length !== PHONE_DIGITS) {
			setPhoneError("Enter a valid 10-digit mobile number.");
			invalid = true;
		}
		if (invalid) return;

		setSubmitting(true);
		try {
			const { exists } = await checkPhone(phone);
			if (exists) {
				setPhoneError("This phone number is already registered.");
				toastInfo(UI_MESSAGES.numberRegistered);
				openLogin({ phone });
				return;
			}
			const otp = await requestOtp(phone);
			setVerificationId(otp.verificationId);
			setResendAfter(otp.resendAfter);
			setOtpError(null);
			setOtpOpen(true);
		} catch {
			setPhoneError("Couldn't send the code. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	/** Verify the guest's OTP → create the account → post the requirement. */
	async function verifyGuestOtp(code: string): Promise<boolean> {
		setVerifying(true);
		setOtpError(null);
		try {
			const result = await otpRegister({
				phone,
				code,
				verificationId,
				userType: signupUserType,
				firstName: firstName.trim() || undefined,
				lastName: lastName.trim() || undefined,
				acceptedTerms: true,
				address: addressMeta?.address || address.trim() || undefined,
				locality: addressMeta?.locality || undefined,
				city: addressMeta?.city || undefined,
				state: addressMeta?.state || undefined,
				pincode: addressMeta?.pincode || undefined,
				latitude: addressMeta?.latitude || undefined,
				longitude: addressMeta?.longitude || undefined,
				professionalCategoryId:
					signupUserType === "professional" ? proCats[0] : undefined,
				supplierProductIds:
					signupUserType === "supplier" ? materialCats : undefined,
			});
			storeSession(result);
			setOtpOpen(false);
			await postRequirement();
			return true;
		} catch {
			setOtpError("That code is invalid or expired. Please try again.");
			return false;
		} finally {
			setVerifying(false);
		}
	}

	async function resendGuestOtp(): Promise<number> {
		const otp = await requestOtp(phone);
		setVerificationId(otp.verificationId);
		return otp.resendAfter;
	}

	const categoryPrompt =
		type === "professional"
			? proIntent === "available"
				? "Select what best describes your profession?"
				: "Which professionals do you need?"
			: intent === "sell"
				? "Which materials do you sell?"
				: "Which materials do you need?";

	const intentToggle = (
		<div className="mb-4 inline-flex rounded-full border border-line bg-white p-0.5">
			{(["buy", "sell"] as const).map((value) => (
				<button
					key={value}
					type="button"
					onClick={() => {
						setIntent(value);
						setPlaceName("");
					}}
					className={`rounded-full px-5 py-1.5 text-[13px] font-semibold capitalize ${
						intent === value ? "bg-primary text-white" : "text-muted"
					}`}
				>
					{value}
				</button>
			))}
		</div>
	);

	// "Other" chip sits inline as the last chip of the category row; its free-text
	// field (when active) drops below the whole chip group.
	const otherChip = (
		<button
			type="button"
			aria-pressed={otherActive}
			onClick={() => {
				setOtherActive((v) => !v);
				if (otherActive) setOtherCategory("");
				if (categoryError) setCategoryError(null);
			}}
			className={`${CHIP} ${otherActive ? CHIP_ON : CHIP_OFF}`}
		>
			Other
		</button>
	);
	const otherField = otherActive ? (
		<div className="mt-2">
			<TextField
				value={otherCategory}
				onChange={setOtherCategory}
				placeholder={
					type === "material"
						? "eg: wood, brick, sand"
						: "eg: carpenter, plumber, electrician"
				}
				autoCapitalize="words"
			/>
		</div>
	) : null;

	return (
		<IonPage>
			<AppHeader title="Post Your Requirement" tinted />
			<IonContent
				style={
					{
						"--background":
							"linear-gradient(180deg, #e8f3fc 0%, #f6f7fb 45%, #f6f7fb 100%)",
					} as React.CSSProperties
				}
			>
				<Container>
					{/* Logged-out visitors sign up inline: their details are collected
					    here and an account is created (via OTP) before the lead posts. */}
					{!isAuthed ? (
						<section className={`mb-4 p-4 ${CARD}`}>
							<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
								<h2 className="m-0 text-[12px] font-bold text-ink">
									Please enter your details.
								</h2>
								<p className="m-0 font-medium text-[11px] w-full text-muted">
									Already have an account?{" "}
									<button
										type="button"
										onClick={() => openLogin({ phone })}
										className="font-semibold text-primary underline underline-offset-2"
									>
										Please login
									</button>
								</p>
							</div>
							<div className="mt-3 flex flex-col gap-3">
								<PhoneField
									value={phone}
									onChange={(digits) => {
										setPhone(digits);
										if (phoneError) setPhoneError(null);
									}}
									error={phoneError}
								/>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<span className="mb-1.5 block text-[12px] font-bold text-ink">
											First name
										</span>
										<TextField
											value={firstName}
											onChange={(value) => {
												setFirstName(value);
												if (nameError) setNameError(null);
											}}
											placeholder="First name"
											autoCapitalize="words"
											error={nameError}
										/>
									</div>
									<div>
										<span className="mb-1.5 block text-[12px] font-bold text-ink">
											Last name
										</span>
										<TextField
											value={lastName}
											onChange={setLastName}
											placeholder="Last name"
											autoCapitalize="words"
										/>
									</div>
								</div>
							</div>
						</section>
					) : null}

					<section className={`p-4 ${CARD}`}>
						<p className="m-0 text-[12px] font-bold text-ink">
							Choose the option that best matches your requirement.
						</p>

						<div className="mt-3 grid grid-cols-3 gap-2.5">
							{OPTIONS.map((option) => {
								const selected = option.type === type;
								return (
									<button
										key={option.type}
										type="button"
										aria-pressed={selected}
										onClick={() => chooseType(option.type)}
										className={`flex h-[92px] flex-col items-start justify-between rounded-[6px] border p-3 text-left transition-colors ${
											selected
												? "border-primary bg-[#f5f7fb]"
												: "border-[#e3e6f0] bg-white"
										}`}
									>
										<span
											className={`grid h-8 w-8 place-items-center rounded-[3px] ${
												selected
													? "bg-primary text-white"
													: "bg-[#f6f7fb] text-ink"
											}`}
										>
											<IonIcon icon={option.icon} className="text-[18px]" />
										</span>
										<span
											className={`text-[11px] leading-tight ${
												selected
													? "font-semibold text-primary"
													: "font-normal text-ink"
											}`}
										>
											{option.label}
										</span>
									</button>
								);
							})}
						</div>

						<div className="mt-4">
							{type === "property" ? (
								<>
									<span className="mb-2 block text-[12px] font-bold text-ink">
										Are you buying or selling?
									</span>
									{intentToggle}

									<span className="mb-2 block text-[12px] font-bold text-ink">
										Property Category
									</span>
									<div className="flex flex-wrap gap-2">
										{PROPERTY_GROUPS.map((group) => (
											<button
												key={group.value}
												type="button"
												aria-pressed={propertyGroup === group.value}
												onClick={() => {
													setPropertyGroup(group.value);
													setPropertyType("");
													setPlaceName("");
													setCategoryError(null);
												}}
												className={`${CHIP} ${
													propertyGroup === group.value ? CHIP_ON : CHIP_OFF
												}`}
											>
												{group.label}
											</button>
										))}
									</div>

									{propertyGroup === "residential" ? (
										<div className="mt-3">
											<span className="mb-2 block text-[12px] font-bold text-ink">
												Property type
											</span>
											<div className="flex flex-wrap gap-2">
												{RESIDENTIAL_TYPES.map((option) => (
													<button
														key={option.value}
														type="button"
														aria-pressed={propertyType === option.value}
														onClick={() => {
															setPropertyType(option.value);
															setCategoryError(null);
														}}
														className={`${CHIP} ${
															propertyType === option.value ? CHIP_ON : CHIP_OFF
														}`}
													>
														{option.label}
													</button>
												))}
											</div>
										</div>
									) : null}

									{/* Society name applies to a residential FLAT sell only. */}
									{intent === "sell" &&
									propertyGroup === "residential" &&
									propertyType === "flat" ? (
										<div className="mt-3">
											<span className="mb-1.5 block text-[12px] font-bold text-ink">
												Society name
											</span>
											<TextField
												value={placeName}
												onChange={setPlaceName}
												placeholder="Society name"
												autoCapitalize="words"
											/>
										</div>
									) : null}

									{intent === "sell" && propertyGroup === "commercial" ? (
										<div className="mt-3">
											<span className="mb-1.5 block text-[12px] font-bold text-ink">
												Commercial property name
											</span>
											<TextField
												value={placeName}
												onChange={setPlaceName}
												placeholder="Commercial property name"
												autoCapitalize="words"
											/>
										</div>
									) : null}

									{categoryError ? (
										<p className="mt-1.5 text-[11px] text-danger">
											{categoryError}
										</p>
									) : null}
								</>
							) : (
								<>
									{type === "material" ? (
										<>
											<span className="mb-2 block text-[12px] font-bold text-ink">
												Are you buying or selling material?
											</span>
											{intentToggle}
										</>
									) : (
										<>
											<span className="mb-2 block text-[12px] font-bold text-ink">
												Are you hiring, or offering your services?
											</span>
											<div className="mb-3 flex flex-wrap gap-2">
												{PRO_INTENTS.map((option) => (
													<button
														key={option.value}
														type="button"
														aria-pressed={proIntent === option.value}
														onClick={() => chooseProIntent(option.value)}
														className={`${CHIP} ${
															proIntent === option.value ? CHIP_ON : CHIP_OFF
														}`}
													>
														{option.label}
													</button>
												))}
											</div>
										</>
									)}

									<div className="mb-2 flex items-baseline gap-2">
										{/* Figma: Bold 10px, #000 */}
										<span className="text-[12px] font-bold text-ink">
											{categoryPrompt}
										</span>
										{/* Figma: Regular 8px, #6C6F7B */}
										<span className="text-[10px] font-normal text-[#6c6f7b]">
											select one or more
										</span>
									</div>

									<CategoryChips
										options={type === "material" ? materialOptions : proOptions}
										selected={type === "material" ? materialCats : proCats}
										single={
											type === "professional" && proIntent === "available"
										}
										error={categoryError}
										trailing={otherChip}
										onChange={(ids) => {
											if (type === "material") setMaterialCats(ids);
											else setProCats(ids);
											if (categoryError) setCategoryError(null);
										}}
									/>
									{otherField}
								</>
							)}

							{showAttachment ? (
								<div className="mt-4">
									<span className="mb-2 block text-[12px] font-bold text-ink">
										Upload images{" "}
									</span>
									<div className="flex flex-wrap gap-2">
										{attachments.map((item, index) => (
											<div
												key={item.url}
												className="relative h-16 w-16 overflow-hidden rounded-lg border border-line"
											>
												<img
													src={item.url}
													alt=""
													className="h-full w-full object-cover"
												/>
												<button
													type="button"
													onClick={() => removeAttachment(index)}
													aria-label="Remove photo"
													className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
												>
													<IonIcon icon={ICONS.close} className="text-xs" />
												</button>
											</div>
										))}
										{attachments.length < MAX_FILES ? (
											<label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-line text-muted-light">
												<IonIcon icon={ICONS.image} className="text-xl" />
												<span className="text-[10px] font-semibold">Add</span>
												<input
													type="file"
													accept="image/*"
													multiple
													className="hidden"
													onChange={onFilesChange}
												/>
											</label>
										) : null}
									</div>
									{fileError ? (
										<p className="mt-1.5 text-[11px] text-danger">
											{fileError}
										</p>
									) : null}
								</div>
							) : null}
						</div>
					</section>

					<section className={`mt-4 p-4 ${CARD}`}>
						<h2 className="m-0 mb-3 text-[12px] font-bold text-ink">
							Add Your Requirement
						</h2>

						<div className="relative">
							<textarea
								value={description}
								onChange={(event) => {
									setDescription(event.target.value);
									if (descriptionError) setDescriptionError(null);
								}}
								rows={4}
								placeholder="Describe your requirement in detail or speech-to-text — Include quantity, budget, location, preferred brands, timeline or any other details."
								className={`w-full resize-none rounded-[9px] border bg-white px-3.5 py-3 pb-12 font-sans text-[12px] text-ink outline-none placeholder:font-medium placeholder:text-[#b2b8c2] focus:border-primary ${
									descriptionError ? "border-danger" : "border-[#dae3ef]"
								}`}
							/>
							<button
								type="button"
								onClick={toggleSpeech}
								className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-[52px] px-3 py-1.5 text-[11px] font-bold ${
									listening
										? "bg-primary text-white"
										: "bg-[#edf2fb] text-primary"
								}`}
							>
								<IonIcon icon={ICONS.micSolid} className="text-[11px]" />
								{listening ? "Listening…" : "Tap to Speak"}
							</button>
						</div>
						{descriptionError ? (
							<p className="mt-1.5 text-[11px] text-danger">
								{descriptionError}
							</p>
						) : null}

						<span className="mb-1.5 mt-4 block text-[12px] font-bold text-ink">
							Address
						</span>
						<AddressAutocomplete
							value={address}
							ariaLabel="Address"
							placeholder="Search your address"
							enableCurrentLocation
							onChange={(value) => {
								setAddress(value);
								// Editing by hand invalidates the last resolved selection.
								setAddressMeta(null);
								if (addressError) setAddressError(null);
							}}
							onSelect={(result) => {
								setAddress(result.full);
								setAddressMeta(result);
								if (addressError) setAddressError(null);
							}}
						/>
						{addressError ? (
							<p className="mt-1.5 text-[11px] text-danger">{addressError}</p>
						) : null}

						<span className="mb-1.5 mt-4 block text-[12px] font-bold text-ink">
							Estimated price
						</span>
						<div className="flex gap-2">
							<input
								type="tel"
								inputMode="numeric"
								value={priceUnsure ? "" : price}
								disabled={priceUnsure}
								placeholder="Price around"
								onChange={(event) =>
									setPrice(event.target.value.replace(/[^\d]/g, ""))
								}
								className="min-w-0 flex-1 rounded-[9px] border border-[#dae3ef] bg-white px-3.5 py-3 font-sans text-[12px] text-ink outline-none placeholder:font-medium placeholder:text-[#b2b8c2] focus:border-primary disabled:opacity-50"
							/>
							<button
								type="button"
								aria-pressed={priceUnsure}
								onClick={() => setPriceUnsure((value) => !value)}
								className={`shrink-0 rounded-[9px] border px-5 text-[14px] font-semibold ${
									priceUnsure
										? "border-primary bg-[#f5f7fb] text-primary"
										: "border-[#dae3ef] bg-white text-muted"
								}`}
							>
								Not Sure
							</button>
						</div>
					</section>

					<button
						type="button"
						onClick={submit}
						disabled={submitting}
						className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary py-3.5 text-[15px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
					>
						{submitting ? (
							<IonSpinner name="crescent" className="h-5 w-5" />
						) : (
							<>
								Post Requirement
								<IonIcon icon={ICONS.arrowForward} className="text-lg" />
							</>
						)}
					</button>
				</Container>

				{/* Guest OTP step — verifying creates the account, then posts. */}
				<IonModal
					isOpen={otpOpen}
					onDidDismiss={() => setOtpOpen(false)}
					initialBreakpoint={1}
					breakpoints={[0, 1]}
				>
					<IonContent>
						<div className="mx-auto flex w-full max-w-[460px] flex-col px-6 pb-10 pt-8">
							<OtpVerify
								phone={phone}
								resendAfter={resendAfter}
								submitting={verifying}
								errorText={otpError}
								submitLabel="Verify & post"
								onVerify={verifyGuestOtp}
								onResend={resendGuestOtp}
								onChangeNumber={() => {
									setOtpOpen(false);
									setOtpError(null);
								}}
							/>
						</div>
					</IonContent>
				</IonModal>
			</IonContent>
		</IonPage>
	);
}
