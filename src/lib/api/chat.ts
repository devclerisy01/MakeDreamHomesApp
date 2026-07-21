import { apiGet, apiPost } from "@/lib/api/client";

/**
 * Chat REST API (routes under `/app/chat/*`). Delivery is AJAX/polling — these
 * back the conversation list, history, new-message polling (`after`), sending,
 * and read receipts. Every call is authenticated (Bearer token + refresh on
 * 401). Mirrors the web app's `lib/api/chat.ts`.
 */

/** The other party in a conversation, from the signed-in user's perspective. */
export interface ChatPeer {
	id: string;
	/** Display name — business name if set, else the full name. */
	name: string;
	firstName: string | null;
	lastName: string | null;
	businessName: string | null;
	/** Resolved (loadable) avatar URL, or null → fall back to initials. */
	image: string | null;
	userType: string | null;
}

/** The lead a conversation is scoped to (id + short title), or null if general. */
export interface ChatLead {
	id: string;
	title: string;
}

/** A conversation as shown in the list (peer + lead + preview + unread count). */
export interface ChatConversation {
	id: string;
	peer: ChatPeer;
	lead: ChatLead | null;
	lastMessage: string | null;
	lastMessageAt: string | null;
	lastMessageFromMe: boolean;
	unreadCount: number;
}

/** A single message. `fromMe` is true when the signed-in user sent it. */
export interface ChatMessage {
	id: string;
	conversationId: string;
	senderId: string;
	body: string;
	fromMe: boolean;
	createdAt: string;
}

/** Max characters accepted in a single message (matches the send DTO). */
export const MESSAGE_MAX = 2000;

/**
 * The signed-in user's conversations, newest activity first. Offset-paginated
 * (default 15); a page shorter than `limit` means the end was reached.
 */
export function listConversations(
	opts: { limit?: number; offset?: number } = {},
	signal?: AbortSignal,
): Promise<ChatConversation[]> {
	const params = new URLSearchParams();
	if (opts.limit != null) params.set("limit", String(opts.limit));
	if (opts.offset != null) params.set("offset", String(opts.offset));
	const qs = params.toString();
	return apiGet<ChatConversation[]>(
		`/app/chat/conversations${qs ? `?${qs}` : ""}`,
		{ auth: true, signal },
	);
}

/**
 * Open (or reuse) a conversation with `targetUserId`. Pass `leadId` to scope the
 * thread to a lead (one thread per user pair per lead); omit for a general chat.
 * Ids are coerced to strings — the API expects numeric-string ids (bigint cols).
 */
export function getOrCreateConversation(
	targetUserId: string,
	leadId?: string,
): Promise<ChatConversation> {
	return apiPost<ChatConversation>(
		"/app/chat/conversations",
		{
			targetUserId: String(targetUserId),
			...(leadId ? { leadId: String(leadId) } : {}),
		},
		{ auth: true },
	);
}

/**
 * Thread messages, always oldest→newest.
 *   - `before`: page backwards through history (oldest loaded id).
 *   - `after`: fetch messages newer than a cursor (newest loaded id) — polling.
 */
export function getMessages(
	conversationId: string,
	opts: { before?: string; after?: string; limit?: number } = {},
	signal?: AbortSignal,
): Promise<ChatMessage[]> {
	const params = new URLSearchParams();
	if (opts.before) params.set("before", opts.before);
	if (opts.after) params.set("after", opts.after);
	params.set("limit", String(opts.limit ?? 30));
	return apiGet<ChatMessage[]>(
		`/app/chat/conversations/${conversationId}/messages?${params.toString()}`,
		{ auth: true, signal },
	);
}

/** Send a message; returns the persisted message. */
export function sendMessage(
	conversationId: string,
	body: string,
): Promise<ChatMessage> {
	return apiPost<ChatMessage>(
		`/app/chat/conversations/${conversationId}/messages`,
		{ body },
		{ auth: true },
	);
}

/** Mark a conversation read up to now. */
export function markConversationRead(
	conversationId: string,
): Promise<{ success: boolean }> {
	return apiPost<{ success: boolean }>(
		`/app/chat/conversations/${conversationId}/read`,
		{},
		{ auth: true },
	);
}

/** Total unread messages across ALL conversations (drives the badge). */
export function getUnreadTotal(signal?: AbortSignal): Promise<number> {
	return apiGet<{ count: number }>("/app/chat/unread-count", {
		auth: true,
		signal,
	}).then((r) => r.count);
}
