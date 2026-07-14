/** Error thrown by the API client on a non-2xx response or `success:false`. */
export class ApiError extends Error {
	readonly status: number;
	readonly details?: unknown;

	constructor(message: string, status: number, details?: unknown) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.details = details;
	}
}

export function isApiError(value: unknown): value is ApiError {
	return value instanceof ApiError;
}
