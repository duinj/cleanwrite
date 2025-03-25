<script lang="ts">
	import { saveAPIKey } from '$lib/stores/gemini';

	export let show = false;

	let apiKey = '';
	let errorMessage = '';

	function handleSubmit() {
		if (!apiKey || apiKey.trim() === '') {
			errorMessage = 'Please enter a valid API key';
			return;
		}

		saveAPIKey(apiKey);
		apiKey = '';
		errorMessage = '';
		show = false;
	}

	function closeModal() {
		if (show) {
			show = false;
			apiKey = '';
			errorMessage = '';
		}
	}
</script>

{#if show}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="w-[90%] max-w-md rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">Gemini API Key Required</h2>

			<p class="mb-4 text-sm text-gray-600">
				To use the LLM rewrite feature, you need to provide a Google Gemini API key. Your key will
				be stored locally in your browser's session storage.
			</p>

			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				<div>
					<label for="apiKey" class="mb-1 block text-sm font-medium text-gray-700"
						>Gemini API Key</label
					>
					<input
						type="password"
						id="apiKey"
						bind:value={apiKey}
						placeholder="Enter your Gemini API key"
						class="focus:border-primary focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
					/>
					{#if errorMessage}
						<p class="mt-1 text-xs text-red-500">{errorMessage}</p>
					{/if}
				</div>

				<div class="flex justify-end space-x-3">
					<button
						type="button"
						on:click={closeModal}
						class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="bg-primary hover:bg-primary-dark rounded-md px-4 py-2 text-sm font-medium text-white"
					>
						Save Key
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
