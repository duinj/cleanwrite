<script lang="ts">
	import '../app.css';
	import { initializeAPIKeyState } from '$lib/stores/gemini';

	// Check if we're in a browser environment
	const isBrowser = typeof window !== 'undefined';

	// Initialize API key state when the app starts, but only in browser
	if (isBrowser) {
		initializeAPIKeyState();
	}

	let { children } = $props();
</script>

{@render children()}
