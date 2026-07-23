import { IonContent, IonIcon, IonPage, IonSpinner } from "@ionic/react";
import { chatbubbleEllipsesOutline } from "ionicons/icons";
import { motion } from "framer-motion";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { ChatLeadBar } from "@/components/chat/ChatLeadBar";
import { AppHeader } from "@/components/layout/AppHeader";
import {
	type ChatConversation,
	type ChatMessage,
	getMessages,
	listConversations,
	markConversationRead,
	MESSAGE_MAX,
	sendMessage,
} from "@/lib/api/chat";
import { formatDateSeparator, formatTime } from "@/lib/chat/format";
import { assetUrl } from "@/lib/asset";
import { useAuth } from "@/lib/auth/session";
import { ICONS } from "@/theme/icons";

/** A message plus its optimistic-send state (before the server confirms it). */
interface UiMessage extends ChatMessage {
	pending?: boolean;
	failed?: boolean;
}

const PAGE_SIZE = 30;
/** Poll cadence: fast while visible, slow when the tab is hidden (matches web). */
const POLL_ACTIVE = 3000;
const POLL_HIDDEN = 20_000;
/** Messages from the same sender within this gap group together (Google Chat). */
const GROUP_GAP_MS = 5 * 60 * 1000;

/** Short peer-role label (person/null → none). */
const ROLE_LABEL: Record<string, string> = {
	professional: "Professional",
	supplier: "Material Supplier",
	dealer: "Property Dealer",
};

/** A run of consecutive messages from the same sender. */
interface MessageGroup {
	key: string;
	fromMe: boolean;
	messages: UiMessage[];
}

/** Group consecutive same-sender messages (5-min splitting), like the web. */
function groupMessages(messages: UiMessage[]): MessageGroup[] {
	const groups: MessageGroup[] = [];
	for (let i = 0; i < messages.length; i++) {
		const m = messages[i];
		const last = groups[groups.length - 1];
		const lastMsg = last?.messages[last.messages.length - 1];
		const withinGap =
			lastMsg &&
			Math.abs(
				new Date(m.createdAt).getTime() - new Date(lastMsg.createdAt).getTime(),
			) < GROUP_GAP_MS;
		if (last && last.fromMe === m.fromMe && withinGap) last.messages.push(m);
		else groups.push({ key: `${m.id}-${i}`, fromMe: m.fromMe, messages: [m] });
	}
	return groups;
}

function initialsOf(name: string): string {
	return (
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? "")
			.join("") || "?"
	);
}

/** Coloured avatar disc for a message group (mine = blue, peer = light). */
function GroupAvatar({
	name,
	image,
	fromMe,
}: {
	name: string;
	image?: string | null;
	fromMe: boolean;
}) {
	const url = assetUrl(image ?? undefined);
	return (
		<div
			className={`mt-6 grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ${
				fromMe ? "bg-primary" : "bg-primary-light"
			}`}
		>
			{url ? (
				<img src={url} alt="" className="h-9 w-9 object-cover" />
			) : (
				<span
					className={`text-[11px] font-bold ${
						fromMe ? "text-white" : "text-primary-dark"
					}`}
				>
					{initialsOf(name)}
				</span>
			)}
		</div>
	);
}

/**
 * A single 1:1 conversation thread in the web's Google-Chat style: every run of
 * messages is left-aligned with the sender's avatar + name + time, bubbles
 * stacked with connected corners (mine tinted blue, peer grey). Loads the newest
 * page, pages older history on scroll-up, polls for new messages, sends
 * optimistically, and marks the thread read while open.
 */
export default function Conversation() {
	const { id } = useParams<{ id: string }>();
	const { isAuthed, user } = useAuth();
	const scrollRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const [meta, setMeta] = useState<ChatConversation | null>(null);
	const [messages, setMessages] = useState<UiMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [hasOlder, setHasOlder] = useState(false);
	const [loadingOlder, setLoadingOlder] = useState(false);
	const [draft, setDraft] = useState("");
	const [sending, setSending] = useState(false);
	const tempCounter = useRef(0);
	const afterRef = useRef<string | null>(null);

	const myName =
		user?.businessName?.trim() ||
		[user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
		"You";
	const myImage = user?.profilePhoto ?? null;
	const peerName = meta?.peer.name ?? "Conversation";
	const peerImage = meta?.peer.image ?? null;
	const role = meta?.peer.userType ? ROLE_LABEL[meta.peer.userType] : null;

	const scrollToBottom = useCallback(() => {
		requestAnimationFrame(() => {
			const el = scrollRef.current;
			if (el) el.scrollTop = el.scrollHeight;
		});
	}, []);

	// Header meta (peer + lead) — no single-conversation endpoint, so find it in
	// the recent list.
	useEffect(() => {
		if (!isAuthed) return;
		const controller = new AbortController();
		listConversations({ limit: 50 }, controller.signal)
			.then((list) => {
				if (!controller.signal.aborted) {
					setMeta(list.find((c) => c.id === id) ?? null);
				}
			})
			.catch(() => {});
		return () => controller.abort();
	}, [id, isAuthed]);

	// Initial page (newest) + mark read.
	useEffect(() => {
		if (!isAuthed) return;
		const controller = new AbortController();
		setLoading(true);
		setMessages([]);
		afterRef.current = null;
		getMessages(id, { limit: PAGE_SIZE }, controller.signal)
			.then((page) => {
				if (controller.signal.aborted) return;
				setMessages(page);
				setHasOlder(page.length >= PAGE_SIZE);
				afterRef.current = page.length ? page[page.length - 1].id : null;
				setLoading(false);
				scrollToBottom();
				void markConversationRead(id).catch(() => {});
			})
			.catch(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [id, isAuthed, scrollToBottom]);

	// Poll for newer messages — 3s visible / 20s hidden, waking on visibility.
	useEffect(() => {
		if (!isAuthed) return;
		let timer: ReturnType<typeof setTimeout>;
		const poll = () => {
			if (document.hidden || !afterRef.current) return;
			getMessages(id, { after: afterRef.current, limit: 50 })
				.then((incoming) => {
					if (incoming.length === 0) return;
					afterRef.current = incoming[incoming.length - 1].id;
					setMessages((prev) => {
						const seen = new Set(prev.map((m) => m.id));
						const fresh = incoming.filter((m) => !seen.has(m.id));
						return fresh.length ? [...prev, ...fresh] : prev;
					});
					scrollToBottom();
					void markConversationRead(id).catch(() => {});
				})
				.catch(() => {});
		};
		const tick = () => {
			poll();
			timer = setTimeout(tick, document.hidden ? POLL_HIDDEN : POLL_ACTIVE);
		};
		timer = setTimeout(tick, POLL_ACTIVE);
		const wake = () => {
			if (!document.hidden) poll();
		};
		document.addEventListener("visibilitychange", wake);
		return () => {
			clearTimeout(timer);
			document.removeEventListener("visibilitychange", wake);
		};
	}, [id, isAuthed, scrollToBottom]);

	// Auto-grow the composer with its content (cap ~150px).
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
	}, [draft]);

	// Load older history when scrolled near the top (preserving scroll position).
	function onScroll() {
		const el = scrollRef.current;
		if (!el || loadingOlder || !hasOlder || el.scrollTop >= 40) return;
		if (!messages.length) return;
		setLoadingOlder(true);
		const prevHeight = el.scrollHeight;
		getMessages(id, { before: messages[0].id, limit: PAGE_SIZE })
			.then((older) => {
				if (older.length) {
					setMessages((prev) => [...older, ...prev]);
					setHasOlder(older.length >= PAGE_SIZE);
					requestAnimationFrame(() => {
						if (scrollRef.current) {
							scrollRef.current.scrollTop =
								scrollRef.current.scrollHeight - prevHeight;
						}
					});
				} else {
					setHasOlder(false);
				}
			})
			.catch(() => {})
			.finally(() => setLoadingOlder(false));
	}

	async function deliver(message: UiMessage) {
		try {
			const saved = await sendMessage(id, message.body);
			afterRef.current = saved.id;
			setMessages((prev) => prev.map((m) => (m.id === message.id ? saved : m)));
		} catch {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === message.id ? { ...m, pending: false, failed: true } : m,
				),
			);
		}
	}

	async function send() {
		const body = draft.trim().slice(0, MESSAGE_MAX);
		if (!body || sending) return;
		setSending(true);
		const optimistic: UiMessage = {
			id: `temp-${++tempCounter.current}`,
			conversationId: id,
			senderId: "me",
			body,
			fromMe: true,
			createdAt: new Date().toISOString(),
			pending: true,
		};
		setMessages((prev) => [...prev, optimistic]);
		setDraft("");
		scrollToBottom();
		await deliver(optimistic);
		setSending(false);
	}

	function retry(message: UiMessage) {
		setMessages((prev) =>
			prev.map((m) =>
				m.id === message.id ? { ...m, failed: false, pending: true } : m,
			),
		);
		void deliver({ ...message, failed: false, pending: true });
	}

	const groups = groupMessages(messages);

	return (
		<IonPage>
			<AppHeader title={peerName} back tinted />
			<IonContent style={{ "--background": "#ffffff" } as React.CSSProperties}>
				{/* Lead / role context strip — pinned under the header. */}
				{meta?.lead || role ? (
					<div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-white px-4 py-2">
						{meta?.lead ? (
							<ChatLeadBar lead={meta.lead} />
						) : role ? (
							<span
								className={`inline-flex w-fit rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
									meta?.peer.userType === "professional"
										? "bg-primary-light text-primary"
										: "bg-surface-muted text-primary-dark"
								}`}
							>
								{role}
							</span>
						) : null}
					</div>
				) : null}

				<div
					ref={scrollRef}
					onScroll={onScroll}
					className="flex h-full flex-col gap-3 overflow-y-auto p-4"
				>
					{loading ? (
						<div className="flex flex-1 items-center justify-center py-10">
							<IonSpinner name="crescent" className="text-primary" />
						</div>
					) : messages.length === 0 ? (
						<div className="grid flex-1 place-items-center text-center">
							<div className="flex flex-col items-center gap-2 px-6">
								<span className="grid h-14 w-14 place-items-center rounded-full bg-primary-light text-primary">
									<IonIcon
										icon={chatbubbleEllipsesOutline}
										className="text-[24px]"
									/>
								</span>
								<p className="font-bold text-ink">Start the conversation</p>
								<p className="max-w-xs text-sm text-muted-light">
									Send a message to discuss requirements, pricing and timelines.
								</p>
							</div>
						</div>
					) : (
						<>
							{hasOlder ? (
								<p className="py-1 text-center text-[11px] text-muted-light">
									{loadingOlder ? "Loading earlier messages…" : ""}
								</p>
							) : null}
							{groups.map((group, gi) => {
								const prev = groups[gi - 1];
								const showDay =
									!prev ||
									new Date(group.messages[0].createdAt).toDateString() !==
										new Date(prev.messages[0].createdAt).toDateString();
								const senderName = group.fromMe ? myName : peerName;
								const avatarImage = group.fromMe ? myImage : peerImage;
								return (
									<Fragment key={group.key}>
										{showDay ? (
											<div className="my-1 flex items-center justify-center">
												<span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-medium text-muted-light">
													{formatDateSeparator(group.messages[0].createdAt)}
												</span>
											</div>
										) : null}
										<motion.div
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.22, ease: "easeOut" }}
											className="flex gap-2.5"
										>
											<GroupAvatar
												name={senderName}
												image={avatarImage}
												fromMe={group.fromMe}
											/>
											<div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
												<div className="flex items-center gap-2 px-1">
													<span className="text-[13px] font-bold text-ink">
														{senderName}
													</span>
													<span className="text-[11px] text-muted-light">
														{formatTime(group.messages[0].createdAt)}
													</span>
												</div>
												{group.messages.map((m, i) => {
													const isFirst = i === 0;
													const isLast = i === group.messages.length - 1;
													return (
														<div
															key={`${m.id}-${i}`}
															className={`w-fit max-w-[95%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed text-ink ${
																!isFirst ? "rounded-tl-md" : ""
															} ${!isLast ? "rounded-bl-md" : ""} ${
																group.fromMe ? "bg-[#DDE7FB]" : "bg-[#F1F2F4]"
															} ${m.failed ? "opacity-60 ring-1 ring-red-400" : ""}`}
														>
															{m.body}
															{m.pending || m.failed ? (
																<span className="mt-0.5 block text-[10px] text-muted-light">
																	{m.pending ? "Sending…" : "Failed · "}
																	{m.failed ? (
																		<button
																			type="button"
																			onClick={() => retry(m)}
																			className="font-bold text-danger underline"
																		>
																			Retry
																		</button>
																	) : null}
																</span>
															) : null}
														</div>
													);
												})}
											</div>
										</motion.div>
									</Fragment>
								);
							})}
						</>
					)}
				</div>
			</IonContent>

			{/* Composer */}
			<div className="border-t border-line bg-white p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						void send();
					}}
					className="mx-auto flex max-w-[640px] items-end gap-2 rounded-2xl border border-line bg-surface-muted px-2 py-1.5 transition-colors focus-within:border-ink focus-within:bg-white"
				>
					<textarea
						ref={textareaRef}
						rows={1}
						value={draft}
						onChange={(event) =>
							setDraft(event.target.value.slice(0, MESSAGE_MAX))
						}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								void send();
							}
						}}
						placeholder="Write your message…"
						className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-ink outline-none placeholder:text-muted-light"
					/>
					<button
						type="submit"
						aria-label="Send"
						disabled={!draft.trim() || sending}
						className="mb-0.5 grid h-9 w-9 shrink-0 self-end place-items-center rounded-full bg-primary text-white transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-40"
					>
						<IonIcon icon={ICONS.arrowForward} className="text-lg" />
					</button>
				</form>
			</div>
		</IonPage>
	);
}
