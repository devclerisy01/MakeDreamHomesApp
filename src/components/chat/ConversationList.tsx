import {
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonRouterLink,
} from "@ionic/react";
import { briefcaseOutline, chatbubbleEllipsesOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { conversationHref } from "@/constants/routes";
import { type ChatConversation, listConversations } from "@/lib/api/chat";
import { formatListTime } from "@/lib/chat/format";
import { assetUrl } from "@/lib/asset";
import { useLogin } from "@/lib/auth/login-gate";
import { useAuth } from "@/lib/auth/session";
import { ICONS } from "@/theme/icons";

const PAGE_SIZE = 15;
/** Refresh the loaded list this often while the screen is visible. */
const POLL_MS = 8_000;

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

/** One conversation row — mirrors the web `ConversationRow`. */
function ConversationRow({ convo }: { convo: ChatConversation }) {
	const url = assetUrl(convo.peer.image ?? undefined);
	const preview = convo.lastMessage
		? convo.lastMessageFromMe
			? `You: ${convo.lastMessage}`
			: convo.lastMessage
		: "No messages yet";
	return (
		<IonRouterLink
			routerLink={conversationHref(convo.id)}
			className="block no-underline"
		>
			<div className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left active:bg-surface-muted">
				<div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-xs font-bold text-primary-dark ring-1 ring-line">
					{url ? (
						<img src={url} alt="" className="h-11 w-11 object-cover" />
					) : (
						initialsOf(convo.peer.name)
					)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="truncate text-sm font-bold text-ink">
							{convo.peer.name}
						</p>
						{convo.lastMessageAt ? (
							<span className="ml-auto shrink-0 text-[11px] text-muted-light">
								{formatListTime(convo.lastMessageAt)}
							</span>
						) : null}
					</div>
					{convo.lead ? (
						<p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted-light">
							<IonIcon
								icon={briefcaseOutline}
								className="shrink-0 text-[13px]"
							/>
							<span className="min-w-0 truncate">{convo.lead.title}</span>
						</p>
					) : null}
					<div className="mt-0.5 flex items-center gap-2">
						<p
							className={`truncate text-[11px] ${
								convo.unreadCount > 0
									? "font-semibold text-ink"
									: "text-muted-light"
							}`}
						>
							{preview}
						</p>
						{convo.unreadCount > 0 ? (
							<span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
								{convo.unreadCount > 99 ? "99+" : convo.unreadCount}
							</span>
						) : null}
					</div>
				</div>
			</div>
		</IonRouterLink>
	);
}

/**
 * The signed-in user's conversation list — search + offset-paginated infinite
 * scroll + a light visibility-aware poll. Rendered both by the standalone
 * Messages page and the Profile "Messages" tab, so it carries no header/refresher
 * (the host supplies those). Bumping `reloadKey` re-loads from the top.
 */
export function ConversationList({ reloadKey = 0 }: { reloadKey?: number }) {
	const { isAuthed } = useAuth();
	const { openLogin } = useLogin();

	const [items, setItems] = useState<ChatConversation[] | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [query, setQuery] = useState("");
	const loadedRef = useRef(0);

	const load = useCallback(async (offset: number, signal?: AbortSignal) => {
		const limit =
			offset === 0 ? Math.max(PAGE_SIZE, loadedRef.current) : PAGE_SIZE;
		const page = await listConversations({ limit, offset }, signal);
		if (signal?.aborted) return;
		setItems((prev) => {
			const next = offset === 0 ? page : [...(prev ?? []), ...page];
			loadedRef.current = next.length;
			return next;
		});
		setHasMore(page.length >= limit);
	}, []);

	useEffect(() => {
		if (!isAuthed) {
			setItems(null);
			return;
		}
		const controller = new AbortController();
		void load(0, controller.signal).catch(() => setItems([]));
		const id = setInterval(() => {
			if (!document.hidden) void load(0).catch(() => {});
		}, POLL_MS);
		return () => {
			controller.abort();
			clearInterval(id);
		};
	}, [isAuthed, load, reloadKey]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q || !items) return items ?? [];
		return items.filter((c) =>
			[
				c.peer.name,
				c.peer.businessName,
				c.peer.firstName,
				c.peer.lastName,
				[c.peer.firstName, c.peer.lastName].filter(Boolean).join(" "),
				c.lead?.title,
				c.lastMessage,
			].some((field) => field?.toLowerCase().includes(q)),
		);
	}, [items, query]);

	if (!isAuthed) {
		return (
			<div className="mt-10">
				<EmptyState
					icon={chatbubbleEllipsesOutline}
					message="Sign in to see your messages."
				/>
				<button
					type="button"
					onClick={() => openLogin()}
					className="mx-auto mt-4 block rounded-[10px] bg-primary px-6 py-2.5 text-[13px] font-bold text-white"
				>
					Log in
				</button>
			</div>
		);
	}

	return (
		<div className="pt-2">
			{/* Search (web-style: icon inside, muted field) */}
			<div className="relative">
				<IonIcon
					icon={ICONS.search}
					className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-muted-light"
				/>
				<input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search conversations"
					className="h-10 w-full rounded-xl border border-line bg-surface-muted pl-9 pr-3 font-sans text-sm text-ink outline-none placeholder:text-muted-light focus:border-ink focus:bg-white"
				/>
			</div>

			<div className="mt-2 flex flex-col gap-0.5">
				{items === null ? (
					Array.from({ length: 6 }, (_, i) => (
						<div
							key={i}
							className="flex items-center gap-3 rounded-2xl px-3 py-3"
						>
							<div className="mdh-shimmer h-11 w-11 shrink-0 rounded-full" />
							<div className="flex flex-1 flex-col gap-2">
								<div className="mdh-shimmer h-3 w-1/2 rounded-md" />
								<div className="mdh-shimmer h-3 w-3/4 rounded-md" />
							</div>
						</div>
					))
				) : filtered.length === 0 ? (
					<EmptyState
						icon={chatbubbleEllipsesOutline}
						message={
							query
								? "No conversations match your search."
								: "No conversations yet. Message a professional to get started."
						}
					/>
				) : (
					filtered.map((convo) => (
						<ConversationRow key={convo.id} convo={convo} />
					))
				)}
			</div>

			<IonInfiniteScroll
				disabled={!hasMore || !!query || items === null}
				onIonInfinite={(event) => {
					void load(loadedRef.current).finally(() =>
						(event.target as HTMLIonInfiniteScrollElement).complete(),
					);
				}}
			>
				<IonInfiniteScrollContent />
			</IonInfiniteScroll>
		</div>
	);
}
