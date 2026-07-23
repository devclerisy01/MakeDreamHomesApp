import { IonIcon, useIonRouter, useIonViewWillEnter } from "@ionic/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { professionalHref, ROUTES } from "@/constants/routes";
import {
	globalSearch,
	type GlobalSearchResult,
	SEARCH_MIN_TERM,
} from "@/lib/api/search";
import { ICONS } from "@/theme/icons";

const EMPTY: GlobalSearchResult = {
	results: [],
	count: 0,
	professionalCount: 0,
	leadCount: 0,
};

/** Top matches shown per group (professionals / leads) in the dropdown; "View
 * all" opens the full directory for the rest. */
const GROUP_LIMIT = 10;

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
 * web hero search). Typing (2+ chars) runs one search and shows BOTH groups at
 * once — Professionals and Leads — each with its top matches, its total-match
 * count badge, and a "View all" that opens the matching directory pre-filtered
 * with the term. Tapping a hit opens it directly.
 */
export function GlobalSearch() {
	const router = useIonRouter();
	const [term, setTerm] = useState("");
	const [result, setResult] = useState<GlobalSearchResult>(EMPTY);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const boxRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const q = term.trim();
	const ready = q.length >= SEARCH_MIN_TERM;

	// Ionic keeps pages mounted, so this component's state survives navigation.
	// Reset the search every time Home becomes active — coming back from anywhere
	// lands on a clean, empty search rather than the previous term/results.
	useIonViewWillEnter(() => {
		setTerm("");
		setResult(EMPTY);
		setOpen(false);
		setLoading(false);
	});

	// Debounced live search across both groups (category "all").
	useEffect(() => {
		if (!ready) {
			setResult(EMPTY);
			setLoading(false);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		const id = setTimeout(() => {
			globalSearch(q, GROUP_LIMIT, "all", controller.signal)
				.then((res) => {
					if (controller.signal.aborted) return;
					setResult(res);
					setLoading(false);
				})
				.catch(() => {
					if (controller.signal.aborted) return;
					setLoading(false);
				});
		}, 250);
		return () => {
			controller.abort();
			clearTimeout(id);
		};
	}, [q, ready]);

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

	function viewAllProfessionals() {
		if (!q) return;
		go(`${ROUTES.professionals}?search=${encodeURIComponent(q.slice(0, 100))}`);
	}

	function viewAllLeads() {
		if (!q) return;
		go(`${ROUTES.leads}?search=${encodeURIComponent(q.slice(0, 100))}`);
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

	const professionalItems = result.results.filter(
		(r) => r.type === "professional",
	);
	const leadItems = result.results.filter((r) => r.type === "lead");
	const totalHits = result.results.length;

	/** One suggestion row — shared by both groups. */
	function renderRow(item: GlobalSearchResult["results"][number]) {
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
						icon={item.type === "lead" ? ICONS.lead : ICONS.professional}
					/>
				</span>
				<span className="min-w-0">
					<span className="block truncate text-sm font-semibold text-ink">
						<Highlight text={item.title || "Requirement"} term={q} />
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
									<IonIcon icon={ICONS.location} className="shrink-0" />
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
	}

	/** A group's heading: title, total-match count badge, and "View all". */
	function renderGroupHeading(
		label: string,
		count: number,
		onViewAll: () => void,
	) {
		return (
			<div className="flex items-center justify-between gap-2 px-4 pb-1 pt-2">
				<span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted">
					{label}
					<span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-primary-light px-1.5 py-0.5 text-[11px] font-bold leading-none text-primary">
						{count}
					</span>
				</span>
				<button
					type="button"
					onClick={onViewAll}
					className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-primary active:bg-primary-light/50"
				>
					View All
				</button>
			</div>
		);
	}

	return (
		<div ref={boxRef} className="relative z-30">
			<form
				role="search"
				onSubmit={(event) => {
					event.preventDefault();
					if (professionalItems.length >= leadItems.length)
						viewAllProfessionals();
					else viewAllLeads();
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
					{loading ? (
						<div aria-live="polite" aria-busy="true">
							{[0, 1, 2].map((i) => (
								<SearchRowSkeleton key={i} />
							))}
						</div>
					) : totalHits === 0 ? (
						<p className="px-4 py-3 text-sm text-muted-light">
							No results found.
						</p>
					) : (
						<>
							{professionalItems.length > 0 ? (
								<div>
									{renderGroupHeading(
										"Professionals",
										result.professionalCount,
										viewAllProfessionals,
									)}
									{professionalItems.map((item) => renderRow(item))}
								</div>
							) : null}

							{leadItems.length > 0 ? (
								<div>
									{renderGroupHeading("Leads", result.leadCount, viewAllLeads)}
									{leadItems.map((item) => renderRow(item))}
								</div>
							) : null}
						</>
					)}
				</div>
			) : null}
		</div>
	);
}
