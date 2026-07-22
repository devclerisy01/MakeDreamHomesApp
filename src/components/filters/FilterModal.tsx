import { IonIcon, IonModal, useIonRouter } from "@ionic/react";
import { checkmark, closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { ICONS } from "@/theme/icons";

/** One selectable option within a filter group. */
export interface FilterOption {
	value: string;
	label: string;
	count?: number;
}

/** A left-pane filter group whose options show in the right pane. */
export interface FilterGroup {
	key: string;
	/** Left-pane tab label. */
	label: string;
	/** Right-pane header (e.g. "Select Type"). */
	header: string;
	/** Multi-select (checkboxes) vs single-select (radio). */
	multi: boolean;
	options: FilterOption[];
}

/** Selected option values, keyed by group key. */
export type FilterSelection = Record<string, string[]>;

/** Show a per-group search box past this many options. */
const SEARCH_THRESHOLD = 8;
/** Collapse a long option list to this many rows, with a "+N more" toggle. */
const COLLAPSED_CAP = 6;

interface FilterModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	groups: FilterGroup[];
	value: FilterSelection;
	/** Commit the chosen selection (fired on Apply). */
	onApply: (next: FilterSelection) => void;
}

const countOf = (sel: FilterSelection) =>
	Object.values(sel).reduce((n, v) => n + v.length, 0);

/**
 * Reusable two-pane filter popup (left = groups, right = options), presented as
 * a bottom-sheet like the login popup. Edits a local draft and commits only on
 * **Apply** (Clear all wipes it); single-select groups behave like radios,
 * multi-select like checkboxes. The caller builds `groups` and maps the
 * resulting `FilterSelection` to its query params.
 */
export function FilterModal({
	isOpen,
	onClose,
	title = "Filters",
	groups,
	value,
	onApply,
}: FilterModalProps) {
	const [draft, setDraft] = useState<FilterSelection>(value);
	const [active, setActive] = useState<string>("");

	// Seed the draft from the applied value each time the sheet opens.
	useEffect(() => {
		if (isOpen) setDraft(value);
	}, [isOpen, value]);

	// Keep a valid active group as the group set changes.
	useEffect(() => {
		if (!isOpen) return;
		setActive((cur) =>
			groups.some((g) => g.key === cur) ? cur : (groups[0]?.key ?? ""),
		);
	}, [isOpen, groups]);

	function toggle(group: FilterGroup, optValue: string) {
		setDraft((d) => {
			const cur = d[group.key] ?? [];
			const has = cur.includes(optValue);
			const next = group.multi
				? has
					? cur.filter((v) => v !== optValue)
					: [...cur, optValue]
				: has
					? []
					: [optValue];
			return { ...d, [group.key]: next };
		});
	}

	const activeGroup = groups.find((g) => g.key === active) ?? null;
	const hasSelection = countOf(draft) > 0;

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			initialBreakpoint={1}
			breakpoints={[0, 1]}
		>
			<div className="flex h-full flex-col bg-white">
				<header className="flex shrink-0 items-center justify-between border-b border-line bg-primary-light/40 px-4 py-3.5">
					<h2 className="m-0 text-lg font-extrabold text-ink">{title}</h2>
					<button
						type="button"
						aria-label="Close"
						onClick={onClose}
						className="grid h-9 w-9 place-items-center rounded-full text-muted-light active:bg-black/5"
					>
						<IonIcon icon={closeOutline} className="text-2xl" />
					</button>
				</header>

				{groups.length === 0 ? (
					<EmptyFilters onClose={onClose} />
				) : (
					<div className="flex min-h-0 flex-1">
						{/* Left: groups */}
						<div className="w-[136px] shrink-0 overflow-y-auto border-r border-line bg-surface-muted/40">
							{groups.map((group) => {
								const on = group.key === active;
								const n = draft[group.key]?.length ?? 0;
								return (
									<button
										key={group.key}
										type="button"
										onClick={() => setActive(group.key)}
										className={`flex w-full items-center gap-1.5 border-b border-line px-4 py-3.5 text-left text-[13px] ${
											on
												? "bg-white font-bold text-ink"
												: "font-medium text-muted"
										}`}
									>
										<span className="min-w-0 flex-1 truncate">
											{group.label}
										</span>
										{n > 0 ? (
											<span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
												{n}
											</span>
										) : null}
									</button>
								);
							})}
						</div>

						{/* Right: options for the active group */}
						<div className="min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
							{activeGroup ? (
								<FilterOptionsPane
									key={activeGroup.key}
									group={activeGroup}
									selected={draft[activeGroup.key] ?? []}
									onToggle={(value) => toggle(activeGroup, value)}
								/>
							) : null}
						</div>
					</div>
				)}

				{/* Footer: Clear all + Apply */}
				<div className="flex shrink-0 items-center gap-3 border-t border-line bg-white px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
					<button
						type="button"
						disabled={!hasSelection}
						onClick={() => setDraft({})}
						className="rounded-xl border border-line px-5 py-3 text-[15px] font-bold text-ink transition-opacity active:opacity-80 disabled:opacity-40"
					>
						Clear all
					</button>
					<button
						type="button"
						onClick={() => {
							onApply(draft);
							onClose();
						}}
						className="flex-1 rounded-xl bg-primary py-3 text-[15px] font-bold text-white active:opacity-90"
					>
						Apply
					</button>
				</div>
			</div>
		</IonModal>
	);
}

/** One check-row in the right pane (single- or multi-select). */
function FilterRow({
	label,
	count,
	selected,
	onClick,
}: {
	label: string;
	count?: number;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			role="checkbox"
			aria-checked={selected}
			onClick={onClick}
			className="flex w-full items-center gap-3 border-b border-line/70 py-3 text-left"
		>
			<IonIcon
				icon={checkmark}
				className={`shrink-0 text-lg ${selected ? "text-primary" : "text-line"}`}
			/>
			<span
				className={`min-w-0 flex-1 truncate text-xs ${
					selected ? "font-semibold text-ink" : "text-muted"
				}`}
			>
				{label}
			</span>
			{count != null ? (
				<span className="shrink-0 text-xs text-muted-light">{count}</span>
			) : null}
		</button>
	);
}

/**
 * Right-pane option list for the active group. Adds a search box once the group
 * has more than {@link SEARCH_THRESHOLD} options, and collapses long lists to
 * {@link COLLAPSED_CAP} rows with a "+N more" / "Show less" toggle — always
 * keeping already-selected options visible. State resets when the caller keys
 * this by the group key.
 */
function FilterOptionsPane({
	group,
	selected,
	onToggle,
}: {
	group: FilterGroup;
	selected: string[];
	onToggle: (value: string) => void;
}) {
	const [query, setQuery] = useState("");
	const [expanded, setExpanded] = useState(false);

	const q = query.trim().toLowerCase();
	const filtered = q
		? group.options.filter((o) => o.label.toLowerCase().includes(q))
		: group.options;
	const selectedSet = new Set(selected);
	// Keep the cap past the last selected row so checked options stay visible.
	const lastSelectedIdx = filtered.reduce(
		(max, o, i) => (selectedSet.has(o.value) ? i : max),
		-1,
	);
	const cap = expanded
		? filtered.length
		: Math.max(COLLAPSED_CAP, lastSelectedIdx + 1);
	const shown = filtered.slice(0, cap);
	const remaining = filtered.length - shown.length;
	const showSearch = group.options.length > SEARCH_THRESHOLD;

	return (
		<>
			<p className="m-0 mb-1 text-[13px] text-muted-light">{group.header}</p>

			{showSearch ? (
				<div className="relative mb-1.5">
					<IonIcon
						icon={ICONS.search}
						className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-light"
					/>
					<input
						type="search"
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setExpanded(false);
						}}
						placeholder={`Search ${group.label}`}
						aria-label={`Search ${group.label}`}
						className="w-full rounded-lg border border-line bg-white py-2 pl-8 pr-2 text-[13px] text-ink outline-none placeholder:text-muted-light [&::-webkit-search-cancel-button]:appearance-none"
					/>
				</div>
			) : null}

			{shown.length === 0 ? (
				<p className="py-2 text-[13px] text-muted-light">No matches.</p>
			) : (
				shown.map((opt) => (
					<FilterRow
						key={opt.value}
						label={opt.label}
						count={opt.count}
						selected={selectedSet.has(opt.value)}
						onClick={() => onToggle(opt.value)}
					/>
				))
			)}

			{remaining > 0 ? (
				<button
					type="button"
					onClick={() => setExpanded(true)}
					className="mt-1.5 text-[13px] font-semibold text-primary"
				>
					+{remaining} more
				</button>
			) : expanded && !q && filtered.length > COLLAPSED_CAP ? (
				<button
					type="button"
					onClick={() => setExpanded(false)}
					className="mt-1.5 text-[13px] font-semibold text-primary"
				>
					Show less
				</button>
			) : null}
		</>
	);
}

/** Empty state shown when there are no filter groups — with a Post-requirement CTA. */
function EmptyFilters({ onClose }: { onClose: () => void }) {
	const router = useIonRouter();
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
			<span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-muted-light">
				<IonIcon icon={ICONS.filters} className="text-2xl" />
			</span>
			<div className="space-y-1">
				<p className="m-0 text-[15px] font-bold text-ink">
					No filters available
				</p>
				<p className="m-0 text-[13px] leading-relaxed text-muted-light">
					Nothing matches this selection yet. Try another category or search.
				</p>
			</div>
			<button
				type="button"
				onClick={() => {
					onClose();
					router.push(ROUTES.requirement);
				}}
				className="mt-1 inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white active:scale-[0.99]"
			>
				<IonIcon icon={ICONS.add} className="text-[15px]" />
				Post your requirement
			</button>
		</div>
	);
}
