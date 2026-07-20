import { IonIcon, IonModal } from "@ionic/react";
import { checkmark, closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";

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
									<span className="min-w-0 flex-1 truncate">{group.label}</span>
									{n > 0 ? (
										<span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
											{n}
										</span>
									) : null}
								</button>
							);
						})}
						{groups.length === 0 ? (
							<p className="px-4 py-6 text-[13px] text-muted-light">
								No filters available.
							</p>
						) : null}
					</div>

					{/* Right: options for the active group */}
					<div className="min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
						{activeGroup ? (
							<>
								<p className="m-0 mb-1 text-[13px] text-muted-light">
									{activeGroup.header}
								</p>
								{activeGroup.options.map((opt) => (
									<FilterRow
										key={opt.value}
										label={opt.label}
										count={opt.count}
										selected={(draft[activeGroup.key] ?? []).includes(
											opt.value,
										)}
										onClick={() => toggle(activeGroup, opt.value)}
									/>
								))}
							</>
						) : null}
					</div>
				</div>

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
