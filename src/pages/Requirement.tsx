import { IonContent, IonPage } from "@ionic/react";
import { addCircleOutline } from "ionicons/icons";

import { EmptyState } from "@/components/common/EmptyState";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";

/** Placeholder — the full Post Requirement flow ships in a later phase. */
export default function Requirement() {
	return (
		<IonPage>
			<AppHeader title="Post Requirement" />
			<IonContent>
				<Container>
					<EmptyState
						icon={addCircleOutline}
						message="Posting a requirement is coming soon."
					/>
				</Container>
			</IonContent>
		</IonPage>
	);
}
