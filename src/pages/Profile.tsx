import { IonContent, IonIcon, IonPage, useIonRouter } from "@ionic/react";
import {
	callOutline,
	chevronForwardOutline,
	heartOutline,
	locationOutline,
	logOutOutline,
	personCircleOutline,
} from "ionicons/icons";

import { Avatar } from "@/components/common/Avatar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout/Container";
import { ROUTES } from "@/constants/routes";
import { userDisplayName } from "@/lib/api/auth";
import { clearSession, useAuth } from "@/lib/auth/session";
import { formatPhone } from "@/lib/format";
import { CARD } from "@/lib/ui";

export default function Profile() {
	const router = useIonRouter();
	const { isAuthed, user } = useAuth();

	if (!isAuthed || !user) {
		return (
			<IonPage>
				<AppHeader title="Profile" />
				<IonContent>
					<Container>
						<div className="mt-6 flex flex-col items-center px-6 py-10 text-center">
							<span className="grid h-20 w-20 place-items-center rounded-full bg-primary-light text-primary">
								<IonIcon icon={personCircleOutline} className="text-5xl" />
							</span>
							<h2 className="mt-4 text-lg font-extrabold text-ink">
								You&apos;re not signed in
							</h2>
							<p className="mt-1.5 max-w-[300px] text-sm text-muted-light">
								Sign in to save professionals, track your leads, and post
								requirements.
							</p>
							<button
								type="button"
								onClick={() => router.push(ROUTES.login, "forward", "push")}
								className="mt-6 w-full max-w-[320px] rounded-xl bg-primary py-3.5 text-[15px] font-bold text-white active:opacity-90"
							>
								Sign in
							</button>
						</div>
					</Container>
				</IonContent>
			</IonPage>
		);
	}

	const rows = [
		user.phone
			? { icon: callOutline, label: "Phone", value: formatPhone(user.phone) }
			: null,
		user.city || user.state
			? {
					icon: locationOutline,
					label: "Location",
					value: [user.city, user.state].filter(Boolean).join(", "),
				}
			: null,
	].filter(Boolean) as { icon: string; label: string; value: string }[];

	return (
		<IonPage>
			<AppHeader title="Profile" />
			<IonContent>
				<Container>
					<section className={`flex items-center gap-3.5 p-4 ${CARD}`}>
						<Avatar
							name={userDisplayName(user)}
							image={user.profilePhoto ?? undefined}
							size={64}
						/>
						<div className="min-w-0 flex-1">
							<h2 className="truncate text-lg font-extrabold text-ink">
								{userDisplayName(user)}
							</h2>
							{user.userType ? (
								<span className="mt-0.5 inline-block text-xs font-semibold capitalize text-primary">
									{user.userType}
								</span>
							) : null}
						</div>
					</section>

					<button
						type="button"
						onClick={() => router.push(ROUTES.saved, "forward", "push")}
						className={`mt-3.5 flex w-full items-center gap-3 px-4 py-3.5 text-left ${CARD}`}
					>
						<IonIcon icon={heartOutline} className="text-xl text-primary" />
						<span className="flex-1 text-sm font-bold text-ink">
							Saved professionals &amp; requirements
						</span>
						<IonIcon
							icon={chevronForwardOutline}
							className="text-muted-light"
						/>
					</button>

					{rows.length > 0 ? (
						<section className={`mt-3.5 overflow-hidden ${CARD}`}>
							{rows.map((row, i) => (
								<div
									key={row.label}
									className={`flex items-center gap-3 px-4 py-3.5 ${
										i > 0 ? "border-t border-line" : ""
									}`}
								>
									<IonIcon
										icon={row.icon}
										className="text-xl text-muted-light"
									/>
									<div className="min-w-0 flex-1">
										<span className="block text-[11px] font-semibold text-muted-light">
											{row.label}
										</span>
										<span className="text-sm font-semibold text-ink">
											{row.value}
										</span>
									</div>
								</div>
							))}
						</section>
					) : null}

					<button
						type="button"
						onClick={() => {
							clearSession();
							router.push(ROUTES.home, "root", "replace");
						}}
						className={`mt-3.5 flex w-full items-center gap-3 px-4 py-3.5 text-left ${CARD}`}
					>
						<IonIcon icon={logOutOutline} className="text-xl text-danger" />
						<span className="flex-1 text-sm font-bold text-danger">
							Sign out
						</span>
						<IonIcon
							icon={chevronForwardOutline}
							className="text-muted-light"
						/>
					</button>
				</Container>
			</IonContent>
		</IonPage>
	);
}
