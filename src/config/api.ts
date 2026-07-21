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

/**
 * Public web-app base URL — used to build shareable, cross-compatible profile
 * links that open in a browser (not the in-app WebView origin). Override with
 * `VITE_WEB_URL`; defaults to the production site.
 */
export const WEB_APP_URL = (
	import.meta.env.VITE_WEB_URL ?? "https://makedreamhomes.com"
).replace(/\/+$/, "");

/** Items requested per listing page (directory + leads). */
export const LISTING_PAGE_SIZE = 10;
