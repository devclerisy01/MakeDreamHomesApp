import { IonIcon, useIonRouter } from "@ionic/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { professionalHref, ROUTES } from "@/constants/routes";
import {
	globalSearch,
	type GlobalSearchResult,
	SEARCH_MAX_LIMIT,
	SEARCH_MIN_TERM,
} from "@/lib/api/search";
import { ICONS } from "@/theme/icons";

type Scope = "professionals" | "leads";

const EMPTY: GlobalSearchResult = { results: [], count: 0 };

/** Initial hits per group; "Load more" grows by this step up to the API cap. */
const INITIAL_LIMIT = 6;
const LIMIT_STEP = 6;

/** Filler words the highlighter skips — mirrors the API's search tokenizer. */
const STOP_WORDS = new Set([
	"a",
	"an",
	"and",
	"any",
	"at",
	"by",
	"for",
	"from",
	"in",
	"me",
	"my",
	"near",
	"of",
	"on",
	"or",
	"the",
	"to",
	"under",
	"with",
]);

/** Break a query into the tokens to highlight. The full normalized phrase comes
 * first so a contiguous hit (e.g. "interior desi" in "Interior Designer") marks
 * as ONE span; the individual words follow as a fallback for scattered matches. */
function highlightTokens(term: string): string[] {
	const normalized = term
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	const words = [
		...new Set(
			normalized.split(" ").filter((t) => t.length > 0 && !STOP_WORDS.has(t)),
		),
	];
	const tokens = normalized.includes(" ") ? [normalized, ...words] : words;
	return tokens.length > 0 ? tokens : normalized ? [normalized] : [];
}

/** Wraps every case-insensitive occurrence of the query's tokens in a
 * highlight span (overlapping token hits merge into one span). */
function Highlight({ text, term }: { text: string; term: string }): ReactNode {
	const tokens = highlightTokens(term);
	if (tokens.length === 0 || !text) return text;

	// Collect every token hit as a [start, end) range…
	const lower = text.toLowerCase();
	const ranges: [number, number][] = [];
	for (const token of tokens) {
		let from = 0;
		for (;;) {
			const at = lower.indexOf(token, from);
			if (at === -1) break;
			ranges.push([at, at + token.length]);
			from = at + token.length;
		}
	}
	if (ranges.length === 0) return text;

	ranges.sort((a, b) => a[0] - b[0]);
	const merged: [number, number][] = [ranges[0]];
	for (const [start, end] of ranges.slice(1)) {
		const last = merged[merged.length - 1];
		if (start <= last[1]) last[1] = Math.max(last[1], end);
		else merged.push([start, end]);
	}

	const parts: ReactNode[] = [];
	let from = 0;
	for (const [start, end] of merged) {
		if (start > from) parts.push(text.slice(from, start));
		parts.push(
			<span key={start} className="font-bold text-primary">
				{text.slice(start, end)}
			</span>,
		);
		from = end;
	}
	parts.push(text.slice(from));
	return <>{parts}</>;
}

/** A single shimmering placeholder row shown while a search is in flight. */
function SearchRowSkeleton() {
	return (
		<div className="flex items-center gap-3 px-4 py-2.5">
			<div className="mdh-shimmer h-8 w-8 shrink-0 rounded-lg" />
			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				<div className="mdh-shimmer h-3 w-2/5 rounded-md" />
				<div className="mdh-shimmer h-2.5 w-3/5 rounded-md" />
			</div>
		</div>
	);
}

/**
 * Home global search — a live typeahead over professionals + leads (mirrors the
 * web hero search). Typing (2+ chars) shows grouped, highlighted suggestions for
 * the active scope; tapping a hit opens it, "Load more" grows the list up to the
 * API cap, and "View all" opens the matching directory pre-filtered with the term.
 */
export function GlobalSearch() {
	const router = useIonRouter();
	const [term, setTerm] = useState("");
	const [scope, setScope] = useState<Scope>("professionals");
	const [limit, setLimit] = useState(INITIAL_LIMIT);
	const [result, setResult] = useState<GlobalSearchResult>(EMPTY);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const boxRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const q = term.trim();
	const ready = q.length >= SEARCH_MIN_TERM;

	// A fresh query or scope always restarts at the small page size.
	useEffect(() => {
		setLimit(INITIAL_LIMIT);
	}, [q, scope]);

	// Debounced live search for the active scope; "Load more" (a higher `limit`
	// on the same term) fetches immediately.
	useEffect(() => {
		if (!ready) {
			setResult(EMPTY);
			setLoading(false);
			setLoadingMore(false);
			return;
		}
		const controller = new AbortController();
		const initial = limit === INITIAL_LIMIT;
		if (initial) setLoading(true);
		else setLoadingMore(true);
		const id = setTimeout(
			() => {
				globalSearch(q, limit, scope, controller.signal)
					.then((res) => {
						if (controller.signal.aborted) return;
						setResult(res);
						setLoading(false);
						setLoadingMore(false);
					})
					.catch(() => {
						if (controller.signal.aborted) return;
						setLoading(false);
						setLoadingMore(false);
					});
			},
			initial ? 300 : 0,
		);
		return () => {
			controller.abort();
			clearTimeout(id);
		};
	}, [q, ready, scope, limit]);

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

	function selectItem(item: GlobalSearchResult["results"][number]) {
		if (item.type === "lead") {
			go(
				`${ROUTES.leads}?category=${item.category}&search=${encodeURIComponent(
					(item.title || q).slice(0, 100),
				)}`,
			);
		} else {
			go(professionalHref(item.id));
		}
	}

	function clear() {
		setTerm("");
		setResult(EMPTY);
		inputRef.current?.focus();
	}

	const rows = result.results;
	const total = result.count;
	const hasMore = total > rows.length;
	const canLoadMore = hasMore && limit < SEARCH_MAX_LIMIT;

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
					ref={inputRef}
					className="min-w-0 flex-1 border-none bg-transparent font-sans text-sm font-semibold text-ink outline-none placeholder:font-semibold placeholder:text-muted-light/70 [&::-webkit-search-cancel-button]:appearance-none"
					type="search"
					value={term}
					maxLength={100}
					placeholder="Describe what you need"
					aria-label="Search"
					role="combobox"
					aria-controls="global-search-suggestions"
					aria-expanded={open && ready}
					onChange={(event) => {
						setTerm(event.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onKeyDown={(event) => {
						if (event.key === "Escape") setOpen(false);
					}}
				/>
				{term ? (
					<button
						type="button"
						aria-label="Clear search"
						onClick={clear}
						className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-light transition-colors active:bg-surface-muted"
					>
						<IonIcon icon={ICONS.close} className="text-lg" />
					</button>
				) : null}
			</form>

			{open && ready ? (
				<div
					id="global-search-suggestions"
					className="absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-line bg-white py-2 shadow-lg"
				>
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
						<div aria-live="polite" aria-busy="true">
							{[0, 1, 2].map((i) => (
								<SearchRowSkeleton key={i} />
							))}
						</div>
					) : rows.length === 0 ? (
						<p className="px-4 py-3 text-sm text-muted-light">
							No results found.
						</p>
					) : (
						<>
							{/* Group heading + total-match count badge */}
							<p className="flex items-center gap-2 px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted">
								Results
								<span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-primary-light px-1.5 py-0.5 text-[11px] font-bold leading-none text-primary">
									{total}
								</span>
							</p>

							{rows.map((item) => {
								const detail =
									item.type === "professional"
										? item.matches?.length
											? item.matches.join(", ")
											: item.profession
										: undefined;
								return (
									<button
										key={`${item.type}-${item.id}`}
										type="button"
										onClick={() => selectItem(item)}
										className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-muted"
									>
										<span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
											<IonIcon
												icon={
													item.type === "lead" ? ICONS.lead : ICONS.professional
												}
											/>
										</span>
										<span className="min-w-0">
											<span className="block truncate text-sm font-semibold text-ink">
												<Highlight
													text={item.title || "Requirement"}
													term={q}
												/>
											</span>
											{detail || item.location ? (
												<span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-light">
													{detail ? (
														<span className="truncate">
															<Highlight text={detail} term={q} />
														</span>
													) : null}
													{detail && item.location ? " · " : null}
													{item.location ? (
														<>
															<IonIcon
																icon={ICONS.location}
																className="shrink-0"
															/>
															<span className="truncate">
																<Highlight text={item.location} term={q} />
															</span>
														</>
													) : null}
												</span>
											) : null}
										</span>
									</button>
								);
							})}

							{/* Load more (grow to the API cap), then hand off to the full
							    directory search via "View all". */}
							{canLoadMore ? (
								<div className="mt-1 border-t border-line px-4 pb-1 pt-2">
									<button
										type="button"
										disabled={loadingMore}
										onClick={() =>
											setLimit((l) =>
												Math.min(l + LIMIT_STEP, SEARCH_MAX_LIMIT),
											)
										}
										className="w-full rounded-lg py-2 text-center text-sm font-bold text-primary active:bg-primary-light/50 disabled:opacity-60"
									>
										{loadingMore ? "Loading…" : "Load more"}
									</button>
								</div>
							) : hasMore ? (
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
