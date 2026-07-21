import { useIonRouter } from "@ionic/react";
import { useState } from "react";

import { conversationHref } from "@/constants/routes";
import { getOrCreateConversation } from "@/lib/api/chat";
import { toastError } from "@/lib/api/toast";
import { useLogin } from "@/lib/auth/login-gate";
import { useAuth } from "@/lib/auth/session";

/**
 * Shared login-gated "message this user" action. Opens (or reuses) a
 * conversation with `targetUserId` — optionally scoped to `leadId` — and
 * navigates to the thread. Logged-out callers get the login prompt first and
 * resume automatically after signing in. Mirrors the web's `useStartChat`.
 */
export function useStartChat() {
	const router = useIonRouter();
	const { isAuthed } = useAuth();
	const { openLogin } = useLogin();
	const [busy, setBusy] = useState(false);

	async function open(targetUserId: string, leadId?: string) {
		setBusy(true);
		try {
			const conversation = await getOrCreateConversation(targetUserId, leadId);
			router.push(conversationHref(conversation.id), "forward", "push");
		} catch {
			// Chat responses are suppressed from the central toaster, so surface
			// this one user-initiated failure explicitly.
			toastError("Couldn't open the chat. Please try again.");
		} finally {
			setBusy(false);
		}
	}

	function startChat(targetUserId: string, leadId?: string) {
		if (!isAuthed) {
			openLogin({ onAuthenticated: () => void open(targetUserId, leadId) });
			return;
		}
		void open(targetUserId, leadId);
	}

	return { startChat, busy };
}
