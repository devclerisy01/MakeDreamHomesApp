import {
	IonContent,
	IonIcon,
	IonPage,
	IonSpinner,
	useIonRouter,
	useIonToast,
} from "@ionic/react";
import {
	arrowForward,
	closeOutline,
	constructOutline,
	cubeOutline,
	homeOutline,
	imageOutline,
	micOutline,
} from "ionicons/icons";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { CategoryChips } from "@/components/common/CategoryChips";
import { TextField } from "@/components/common/TextField";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { loginHref, ROUTES } from "@/constants/routes";
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
import { isLoggedIn } from "@/lib/auth/session";
import { CARD } from "@/lib/ui";

type Intent = "buy" | "sell";
type ProIntent = "hire" | "available";

const OPTIONS: { type: RequirementType; label: string; icon: string }[] = [
	{
		type: "professional",
		label: "Professional Services",
		icon: constructOutline,
	},
	{ type: "property", label: "Buy / Sell Properties", icon: homeOutline },
	{ type: "material", label: "Material Suppliers", icon: cubeOutline },
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
	"rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors";
const CHIP_ON = "border-primary bg-primary text-white";
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
	const [present] = useIonToast();

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
	const [price, setPrice] = useState("");
	const [priceUnsure, setPriceUnsure] = useState(false);

	const [proOptions, setProOptions] = useState<CategoryOption[]>([]);
	const [materialOptions, setMaterialOptions] = useState<CategoryOption[]>([]);
	const [categoryError, setCategoryError] = useState<string | null>(null);
	const [descriptionError, setDescriptionError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [listening, setListening] = useState(false);
	const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
	const attachmentsRef = useRef<Attachment[]>([]);
	attachmentsRef.current = attachments;

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
			void present({
				message: "Voice input isn't available on this device.",
				duration: 1800,
				position: "bottom",
			});
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

	async function submit() {
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
		if (!description.trim()) {
			setDescriptionError("Please describe your requirement.");
			invalid = true;
		}
		if (invalid) return;

		if (!isLoggedIn()) {
			void present({
				message: "Please sign in to post your requirement.",
				duration: 1600,
				position: "bottom",
			});
			router.push(
				loginHref({ returnTo: ROUTES.requirement }),
				"forward",
				"push",
			);
			return;
		}

		setSubmitting(true);
		try {
			let imageUrl: string | undefined;
			if (showAttachment && attachments.length > 0) {
				const keys = await Promise.all(
					attachments.map((item) => uploadLeadAttachment(item.file)),
				);
				imageUrl = keys.join(",");
			}
			await createRequirement({
				type,
				intent: type === "professional" ? undefined : intent,
				categories: type === "property" ? undefined : selectedCategoryNames(),
				propertyRequirement:
					type === "property"
						? [propertyGroup, propertyType].filter(Boolean).join(",")
						: undefined,
				placeName:
					type === "property" && intent === "sell" ? placeName : undefined,
				description,
				address,
				price: priceUnsure ? "" : price,
				imageUrl,
			});
			void present({
				message: "Requirement posted successfully.",
				duration: 1600,
				position: "top",
				color: "success",
			});
			resetForm();
			router.push(ROUTES.leads, "root");
		} catch {
			void present({
				message: "Couldn't post your requirement. Please try again.",
				duration: 2000,
				position: "top",
				color: "danger",
			});
		} finally {
			setSubmitting(false);
		}
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
		<div className="mb-3 inline-flex rounded-full border border-line bg-white p-0.5">
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

	const otherPicker = (
		<div className="mt-2">
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
			{otherActive ? (
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
			) : null}
		</div>
	);

	return (
		<IonPage>
			<AppHeader title="Post Your Requirement" />
			<IonContent>
				<Container>
					<section className={`p-4 ${CARD}`}>
						<p className="m-0 text-sm font-semibold text-ink">
							Choose the option that best matches your requirement.
						</p>

						<div className="mt-3 grid grid-cols-3 gap-2">
							{OPTIONS.map((option) => {
								const selected = option.type === type;
								return (
									<button
										key={option.type}
										type="button"
										aria-pressed={selected}
										onClick={() => chooseType(option.type)}
										className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
											selected
												? "border-primary bg-primary-light/50"
												: "border-line bg-white"
										}`}
									>
										<span
											className={`grid h-9 w-9 place-items-center rounded-lg ${
												selected
													? "bg-primary text-white"
													: "bg-surface-muted text-ink"
											}`}
										>
											<IonIcon icon={option.icon} className="text-lg" />
										</span>
										<span
											className={`text-[12px] font-semibold leading-tight ${
												selected ? "text-primary" : "text-ink"
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
									<span className="mb-2 block text-sm font-semibold text-ink">
										Are you buying or selling?
									</span>
									{intentToggle}

									<span className="mb-2 block text-sm font-semibold text-ink">
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
											<span className="mb-2 block text-sm font-semibold text-ink">
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

									{/* Society / commercial name applies to a SELL requirement only. */}
									{intent === "sell" && propertyGroup === "residential" ? (
										<div className="mt-3">
											<span className="mb-1.5 block text-sm font-semibold text-ink">
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
											<span className="mb-1.5 block text-sm font-semibold text-ink">
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
										<p className="mt-1.5 text-sm text-danger">
											{categoryError}
										</p>
									) : null}
								</>
							) : (
								<>
									{type === "material" ? (
										<>
											<span className="mb-2 block text-sm font-semibold text-ink">
												Are you buying or selling material?
											</span>
											{intentToggle}
										</>
									) : (
										<>
											<span className="mb-2 block text-sm font-semibold text-ink">
												Are you hiring, or offering your services?
											</span>
											<div className="mb-3 flex flex-wrap gap-2">
												{PRO_INTENTS.map((option) => (
													<button
														key={option.value}
														type="button"
														aria-pressed={proIntent === option.value}
														onClick={() => setProIntent(option.value)}
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
										<span className="text-sm font-semibold text-ink">
											{categoryPrompt}
										</span>
										<span className="text-xs text-muted-light">
											select one or more
										</span>
									</div>

									<CategoryChips
										options={type === "material" ? materialOptions : proOptions}
										selected={type === "material" ? materialCats : proCats}
										error={categoryError}
										onChange={(ids) => {
											if (type === "material") setMaterialCats(ids);
											else setProCats(ids);
											if (categoryError) setCategoryError(null);
										}}
									/>
									{otherPicker}
								</>
							)}

							{showAttachment ? (
								<div className="mt-4">
									<span className="mb-2 block text-sm font-semibold text-ink">
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
													<IonIcon icon={closeOutline} className="text-xs" />
												</button>
											</div>
										))}
										{attachments.length < MAX_FILES ? (
											<label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-line text-muted-light">
												<IonIcon icon={imageOutline} className="text-xl" />
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
										<p className="mt-1.5 text-sm text-danger">{fileError}</p>
									) : null}
								</div>
							) : null}
						</div>
					</section>

					<section className={`mt-4 p-4 ${CARD}`}>
						<h2 className="m-0 mb-3 text-base font-extrabold text-ink">
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
								className={`w-full resize-none rounded-xl border bg-white px-3.5 py-3 pb-12 font-sans text-sm text-ink outline-none placeholder:text-muted-light focus:border-primary ${
									descriptionError ? "border-danger" : "border-line"
								}`}
							/>
							<button
								type="button"
								onClick={toggleSpeech}
								className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
									listening
										? "bg-primary text-white"
										: "bg-primary-light text-primary"
								}`}
							>
								<IonIcon icon={micOutline} className="text-sm" />
								{listening ? "Listening…" : "Tap to speak"}
							</button>
						</div>
						{descriptionError ? (
							<p className="mt-1.5 text-sm text-danger">{descriptionError}</p>
						) : null}

						<span className="mb-1.5 mt-4 block text-sm font-semibold text-ink">
							Address
						</span>
						<TextField
							value={address}
							onChange={setAddress}
							placeholder="Address"
							ariaLabel="Address"
						/>

						<span className="mb-1.5 mt-4 block text-sm font-semibold text-ink">
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
								className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 py-3 font-sans text-base text-ink outline-none placeholder:text-muted-light focus:border-primary disabled:opacity-50"
							/>
							<button
								type="button"
								aria-pressed={priceUnsure}
								onClick={() => setPriceUnsure((value) => !value)}
								className={`shrink-0 rounded-xl border px-5 text-[14px] font-semibold ${
									priceUnsure
										? "border-primary bg-primary text-white"
										: "border-line bg-white text-muted"
								}`}
							>
								Not sure
							</button>
						</div>
					</section>

					<button
						type="button"
						onClick={submit}
						disabled={submitting}
						className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-[15px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
					>
						{submitting ? (
							<IonSpinner name="crescent" className="h-5 w-5" />
						) : (
							<>
								Post Requirement
								<IonIcon icon={arrowForward} className="text-lg" />
							</>
						)}
					</button>
				</Container>
			</IonContent>
		</IonPage>
	);
}
