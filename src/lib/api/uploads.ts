import { apiPost } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

/**
 * Direct-to-storage presigned upload (mirrors the web `uploadImageViaPresign`).
 * The API mints a short-lived PUT URL (`POST /app/uploads/presign`); the file is
 * uploaded straight to storage — no bytes flow through the API — and the
 * returned bucket-relative `key` is what callers persist. Reads resolve the key
 * to a loadable URL server-side, so callers store the KEY, not a URL.
 *
 * @returns the bucket-relative object key to persist.
 */
export async function uploadImageViaPresign(
	file: File,
	folder: string,
): Promise<string> {
	const { key, uploadUrl } = await apiPost<{ key: string; uploadUrl: string }>(
		"/app/uploads/presign",
		{ folder, contentType: file.type },
		{ auth: true },
	);

	// Straight to storage — not through the API client (no envelope, no Bearer;
	// the presigned URL itself authorizes the write). The Content-Type MUST match
	// what was signed or storage rejects the PUT.
	const res = await fetch(uploadUrl, {
		method: "PUT",
		body: file,
		headers: { "Content-Type": file.type },
	}).catch(() => {
		throw new ApiError("network_error", 0);
	});
	if (!res.ok) throw new ApiError("upload_failed", res.status);

	return key;
}
