import { writable } from 'svelte/store';

// Store to track if an LLM request is in progress
export const isLLMLoading = writable(false);

// Store to track if an API key is available
export const hasAPIKey = writable(false);

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize the API key state on app load
export function initializeAPIKeyState(): void {
	// Only try to access sessionStorage in browser environment
	if (!isBrowser) {
		hasAPIKey.set(false);
		return;
	}

	// Check if API key exists either in env or in session storage
	const apiKeyExists =
		(typeof import.meta.env.VITE_GEMINI_API_KEY !== 'undefined' &&
			import.meta.env.VITE_GEMINI_API_KEY !== '') ||
		sessionStorage.getItem('gemini_api_key') !== null;

	hasAPIKey.set(apiKeyExists);
}

// Save API key to session storage
export function saveAPIKey(key: string): void {
	if (!isBrowser || !key || key.trim() === '') return;

	sessionStorage.setItem('gemini_api_key', key.trim());
	hasAPIKey.set(true);
}

// Clear API key from session storage
export function clearAPIKey(): void {
	if (!isBrowser) return;

	sessionStorage.removeItem('gemini_api_key');
	// Only set false if there's no env var key
	hasAPIKey.set(
		typeof import.meta.env.VITE_GEMINI_API_KEY !== 'undefined' &&
			import.meta.env.VITE_GEMINI_API_KEY !== ''
	);
}
