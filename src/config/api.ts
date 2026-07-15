/**
 * Backend (NestJS) API configuration for the mobile app.
 *
 * `VITE_API_URL` must point at the versioned API root, e.g.
 * `http://localhost:8080/api/v1`. On a real device `localhost` refers to the
 * device itself — set `VITE_API_URL` to the machine's LAN IP or a deployed URL
 * when testing on hardware.
 */
export const API_BASE_URL = (
	import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1"
).replace(/\/+$/, "");

/** Items requested per listing page (directory + leads). */
export const LISTING_PAGE_SIZE = 10;
