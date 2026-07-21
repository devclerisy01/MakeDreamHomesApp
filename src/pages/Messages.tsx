import {
	IonContent,
	IonPage,
	IonRefresher,
	IonRefresherContent,
} from "@ionic/react";
import { useState } from "react";

import { ConversationList } from "@/components/chat/ConversationList";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";

/**
 * Standalone Messages page — a header + the shared {@link ConversationList}
 * (the same list the Profile "Messages" tab renders). Pull-to-refresh reloads
 * the list from the top.
 */
export default function Messages() {
	const [reloadKey, setReloadKey] = useState(0);
	return (
		<IonPage>
			<AppHeader title="Messages" back tinted />
			<IonContent style={{ "--background": "#ffffff" } as React.CSSProperties}>
				<IonRefresher
					slot="fixed"
					onIonRefresh={(event) => {
						setReloadKey((k) => k + 1);
						event.detail.complete();
					}}
				>
					<IonRefresherContent />
				</IonRefresher>
				<Container>
					<ConversationList reloadKey={reloadKey} />
				</Container>
			</IonContent>
		</IonPage>
	);
}
