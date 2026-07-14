import { useCallback, useEffect, useRef, useState } from "react";

export type ListStatus = "loading" | "ready" | "error";

export interface Page<T> {
	items: T[];
	totalPages: number;
}

type Fetcher<T> = (page: number, signal: AbortSignal) => Promise<Page<T>>;

export interface PagedList<T> {
	items: T[];
	status: ListStatus;
	hasMore: boolean;
	loadMore: () => Promise<void>;
	reload: () => void;
	/** Drop the already-loaded items matching `predicate` (e.g. on unsave). */
	removeItem: (predicate: (item: T) => boolean) => void;
}

/**
 * Generic paged-list state for the listing screens: fetches page 1 whenever
 * `resetKey` changes (or `reload()` is called), appends further pages via
 * `loadMore()`, and cancels in-flight requests on reset/unmount.
 *
 * `fetcher` is read through a ref so a new closure each render never re-triggers
 * the reset — the reset is driven solely by `resetKey`.
 */
export function usePagedList<T>(
	fetcher: Fetcher<T>,
	resetKey: string,
): PagedList<T> {
	const [items, setItems] = useState<T[]>([]);
	const [status, setStatus] = useState<ListStatus>("loading");
	const [hasMore, setHasMore] = useState(false);
	const [nonce, setNonce] = useState(0);

	const pageRef = useRef(1);
	const fetcherRef = useRef(fetcher);
	fetcherRef.current = fetcher;

	useEffect(() => {
		const controller = new AbortController();
		pageRef.current = 1;
		setStatus("loading");
		setItems([]);
		setHasMore(false);
		fetcherRef
			.current(1, controller.signal)
			.then((res) => {
				if (controller.signal.aborted) return;
				setItems(res.items);
				setHasMore(res.totalPages > 1);
				setStatus("ready");
			})
			.catch(() => {
				if (!controller.signal.aborted) setStatus("error");
			});
		return () => controller.abort();
	}, [resetKey, nonce]);

	const loadMore = useCallback(async () => {
		const next = pageRef.current + 1;
		const controller = new AbortController();
		try {
			const res = await fetcherRef.current(next, controller.signal);
			pageRef.current = next;
			setItems((prev) => [...prev, ...res.items]);
			setHasMore(next < res.totalPages);
		} catch {
			/* keep what we have; the next scroll can retry */
		}
	}, []);

	const reload = useCallback(() => setNonce((n) => n + 1), []);

	const removeItem = useCallback((predicate: (item: T) => boolean) => {
		setItems((prev) => prev.filter((item) => !predicate(item)));
	}, []);

	return { items, status, hasMore, loadMore, reload, removeItem };
}
