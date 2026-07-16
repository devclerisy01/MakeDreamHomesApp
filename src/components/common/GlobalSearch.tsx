import { IonIcon, useIonRouter } from "@ionic/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { professionalHref, ROUTES } from "@/constants/routes";
import {
	globalSearch,
	type GlobalSearchResult,
	SEARCH_MIN_TERM,
} from "@/lib/api/search";
import { ICONS } from "@/theme/icons";

type Scope = "professionals" | "leads";

const EMPTY: GlobalSearchResult = {
	users: [],
	leads: [],
	totals: { users: 0, leads: 0, products: 0 },
};

/** Case-insensitive highlight of the search term within a label. */
function Highlight({ text, term }: { text: string; term: string }): ReactNode {
	const t = term.trim();
	if (!t || !text) return text;
	const idx = text.toLowerCase().indexOf(t.toLowerCase());
	if (idx === -1) return text;
	return (
		<>
			{text.slice(0, idx)}
			<span className="font-bold text-primary">
				{text.slice(idx, idx + t.length)}
			</span>
			{text.slice(idx + t.length)}
		</>
	);
}

/**
 * Home global search — a live typeahead over professionals + leads (mirrors the
 * web hero search). Typing shows grouped, highlighted suggestions for the active
 * scope; tapping a hit opens it, and "View all" (or the search button) opens the
 * matching directory pre-filtered with the term.
 */
export function GlobalSearch() {
	const router = useIonRouter();
	const [term, setTerm] = useState("");
	const [scope, setScope] = useState<Scope>("professionals");
	const [result, setResult] = useState<GlobalSearchResult>(EMPTY);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const boxRef = useRef<HTMLDivElement>(null);

	const q = term.trim();
	const ready = q.length >= SEARCH_MIN_TERM;

	// Debounced live search for the active scope.
	useEffect(() => {
		if (!ready) {
			setResult(EMPTY);
			setLoading(false);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		const id = setTimeout(() => {
			globalSearch(q, 6, scope, controller.signal)
				.then((res) => {
					setResult(res);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		}, 300);
		return () => {
			controller.abort();
			clearTimeout(id);
		};
	}, [q, ready, scope]);

	// Close the dropdown on an outside tap.
	useEffect(() => {
		if (!open) return;
		function onDown(event: MouseEvent | TouchEvent) {
			if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onDown);
		document.addEventListener("touchstart", onDown);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("touchstart", onDown);
		};
	}, [open]);

	function go(href: string) {
		setOpen(false);
		router.push(href, "forward", "push");
	}

	function viewAll() {
		if (!q) return;
		const base = scope === "leads" ? ROUTES.leads : ROUTES.professionals;
		go(`${base}?search=${encodeURIComponent(q.slice(0, 100))}`);
	}

	const rows = scope === "professionals" ? result.users : result.leads;
	const total =
		scope === "professionals" ? result.totals.users : result.totals.leads;
	const scopes = useMemo(
		() =>
			[
				{ id: "professionals" as const, label: "Professionals" },
				{ id: "leads" as const, label: "Leads" },
			] satisfies { id: Scope; label: string }[],
		[],
	);

	return (
		<div ref={boxRef} className="relative z-30">
			<form
				role="search"
				onSubmit={(event) => {
					event.preventDefault();
					viewAll();
				}}
				className="flex items-center gap-2 rounded-[10px] border border-line bg-white px-2 py-2 shadow-card-sm"
			>
				<span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-surface-muted">
					<IonIcon icon={ICONS.search} className="text-xl text-muted-light" />
				</span>
				<input
					className="min-w-0 flex-1 border-none bg-transparent font-sans text-sm font-semibold text-ink outline-none placeholder:font-semibold placeholder:text-muted-light/70"
					type="search"
					value={term}
					placeholder="Describe what you need"
					aria-label="Search"
					onChange={(event) => {
						setTerm(event.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
				/>
			</form>

			{open && ready ? (
				<div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-line bg-white py-2 shadow-lg">
					{/* Scope toggle */}
					<div className="mx-3 mb-1 flex rounded-full border border-line bg-surface-muted p-0.5">
						{scopes.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setScope(s.id)}
								className={`flex-1 rounded-full py-1.5 text-[13px] font-semibold ${
									scope === s.id ? "bg-primary text-white" : "text-muted"
								}`}
							>
								{s.label}
							</button>
						))}
					</div>

					{loading ? (
						<p className="px-4 py-3 text-sm text-muted-light">Searching…</p>
					) : rows.length === 0 ? (
						<p className="px-4 py-3 text-sm text-muted-light">
							No results found.
						</p>
					) : (
						<>
							{scope === "professionals"
								? result.users.map((u) => (
										<button
											key={u.id}
											type="button"
											onClick={() => go(professionalHref(u.id))}
											className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-muted"
										>
											<span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
												<IonIcon icon={ICONS.professional} />
											</span>
											<span className="min-w-0">
												<span className="block truncate text-sm font-semibold text-ink">
													<Highlight text={u.name} term={q} />
												</span>
												<span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-light">
													{u.profession ? (
														<Highlight text={u.profession} term={q} />
													) : null}
													{u.profession && u.location ? " · " : null}
													{u.location ? (
														<span className="truncate">
															<Highlight text={u.location} term={q} />
														</span>
													) : null}
												</span>
											</span>
										</button>
									))
								: result.leads.map((l) => (
										<button
											key={l.id}
											type="button"
											onClick={() =>
												go(
													`${ROUTES.leads}?category=${l.category}&search=${encodeURIComponent(l.title)}`,
												)
											}
											className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-muted"
										>
											<span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
												<IonIcon icon={ICONS.lead} />
											</span>
											<span className="min-w-0">
												<span className="block truncate text-sm font-semibold text-ink">
													<Highlight text={l.title || "Requirement"} term={q} />
												</span>
												{l.location ? (
													<span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-light">
														<IonIcon
															icon={ICONS.location}
															className="shrink-0"
														/>
														<span className="truncate">
															<Highlight text={l.location} term={q} />
														</span>
													</span>
												) : null}
											</span>
										</button>
									))}

							{total > rows.length ? (
								<div className="mt-1 border-t border-line px-4 pb-1 pt-2">
									<button
										type="button"
										onClick={viewAll}
										className="w-full rounded-lg py-2 text-center text-sm font-bold text-primary active:bg-primary-light/50"
									>
										View all {total} results
									</button>
								</div>
							) : null}
						</>
					)}
				</div>
			) : null}
		</div>
	);
}
