/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Versioned API root, e.g. `http://localhost:8080/api/v1`. */
	readonly VITE_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
