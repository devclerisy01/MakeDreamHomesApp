import { useState } from "react";

import type { LightboxImage } from "@/components/common/Lightbox";
import { fetchPortfolioImages } from "@/lib/api/portfolio";
import { getImageSrc } from "@/lib/format";
import type { PortfolioItem } from "@/types";

/**
 * Portfolio-gallery state + open handler for the detail-page portfolio grid.
 * Each card carries only a cover; tapping one opens a {@link Lightbox} of that
 * item's FULL image set:
 *   • supplier products already carry their `images`, so they open instantly;
 *   • professional/dealer portfolios carry only a cover, so the full set is
 *     fetched on tap (`GET /app/users/portfolio/:id/images`), falling back to
 *     the cover if the fetch is empty.
 */
export function usePortfolioGallery() {
	const [gallery, setGallery] = useState<{
		images: LightboxImage[];
		index: number;
	} | null>(null);
	const [loadingId, setLoadingId] = useState<string | null>(null);

	const openGallery = async (item: PortfolioItem) => {
		if (loadingId) return;
		const caption = {
			title: item.title ?? undefined,
			subtitle: item.city ?? item.location ?? undefined,
		};
		const toImages = (urls: string[]): LightboxImage[] =>
			urls.filter(Boolean).map((src) => ({ src, ...caption }));

		// Supplier products already carry their full image set — no fetch needed.
		if (item.images && item.images.length > 0) {
			const images = toImages(item.images);
			if (images.length) setGallery({ images, index: 0 });
			return;
		}

		// Professional/dealer portfolios carry only a cover — load the full set.
		setLoadingId(item.id);
		try {
			const urls = await fetchPortfolioImages(item.id);
			const cover = getImageSrc(item);
			const list = urls.length ? urls : cover ? [cover] : [];
			const images = toImages(list);
			if (images.length) setGallery({ images, index: 0 });
		} finally {
			setLoadingId(null);
		}
	};

	const setIndex = (index: number) =>
		setGallery((g) => (g ? { ...g, index } : g));
	const closeGallery = () => setGallery(null);

	return { gallery, loadingId, openGallery, setIndex, closeGallery };
}
