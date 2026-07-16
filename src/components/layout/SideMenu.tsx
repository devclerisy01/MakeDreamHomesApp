import {
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonMenu,
	IonMenuToggle,
	IonTitle,
	IonToolbar,
	useIonRouter,
} from "@ionic/react";
import { logOutOutline, personAddOutline } from "ionicons/icons";

import { ROUTES } from "@/constants/routes";
import { useLogin } from "@/lib/auth/login-gate";
import { clearSession, useAuth } from "@/lib/auth/session";

/**
 * App side drawer (slides in from the start edge), opened by the header's
 * "three bars" button. Holds the account action: Sign out when signed in,
 * Sign up when signed out. `IonMenuToggle` closes the drawer on selection.
 */
export function SideMenu() {
	const router = useIonRouter();
	const { isAuthed } = useAuth();
	const { openSignup } = useLogin();

	function signOut() {
		clearSession();
		router.push(ROUTES.home, "root", "replace");
	}

	return (
		<IonMenu menuId="app-menu" contentId="main-content" side="start">
			<IonHeader>
				<IonToolbar>
					<IonTitle>Menu</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<IonList>
					<IonMenuToggle autoHide={false}>
						{isAuthed ? (
							<IonItem button detail={false} onClick={signOut}>
								<IonIcon slot="start" icon={logOutOutline} color="danger" />
								<IonLabel color="danger">Sign out</IonLabel>
							</IonItem>
						) : (
							<IonItem button detail={false} onClick={() => openSignup()}>
								<IonIcon slot="start" icon={personAddOutline} />
								<IonLabel>Sign up</IonLabel>
							</IonItem>
						)}
					</IonMenuToggle>
				</IonList>
			</IonContent>
		</IonMenu>
	);
}
