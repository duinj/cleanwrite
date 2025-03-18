<script lang="ts">
	import { onMount } from 'svelte';
	import Line from '$lib/components/Line.svelte';
	import WrittenText from '$lib/components/WrittenText.svelte';

	let writtenText: string[] = [];
	let focusedHistoryIndex: number = -1;
	let lineComponent: Line;
	let writtenTextComponent: WrittenText;

	/**
	 * Handle when a line is submitted from the Line component
	 */
	function handleLineSubmit(event: CustomEvent<string>) {
		writtenText = [...writtenText, event.detail];
		focusedHistoryIndex = -1; // Reset focus when submitting new line

		// Reset the scroll position after DOM update
		setTimeout(() => {
			// Calculate appropriate scroll position
			const viewportHeight = window.innerHeight;

			// Adjust scroll position to account for top padding and ensure new text is visible
			if (writtenText.length === 1) {
				// For the first line, just make sure we're at the top of the document
				window.scrollTo(0, 0);
			} else {
				// For subsequent lines, position properly relative to input line
				const scrollPosition = document.body.scrollHeight - viewportHeight * 0.65;
				window.scrollTo(0, scrollPosition);
			}

			// Enhance blur effect
			writtenTextComponent.enhanceBlur();
		}, 10);
	}

	/**
	 * Handle when a history item is focused
	 */
	function handleHistoryFocus(event: CustomEvent<number>) {
		focusedHistoryIndex = event.detail;
	}

	/**
	 * Handle when a history item is edited
	 */
	function handleHistoryEdit(event: CustomEvent<{ index: number; text: string }>) {
		const { index, text } = event.detail;

		if (index >= 0 && index < writtenText.length) {
			// Update the history item at the specific index
			const position = writtenText.length - 1 - index;

			// Create a new array with the updated item
			const updatedHistory = [...writtenText];
			updatedHistory[position] = text;
			writtenText = updatedHistory;
		}
	}

	onMount(() => {
		// Focus the input field when the component is mounted
		lineComponent.focus();
	});
</script>

<div class="app-container">
	<WrittenText
		lines={writtenText}
		focusedIndex={focusedHistoryIndex}
		bind:this={writtenTextComponent}
	/>
	<Line
		bind:this={lineComponent}
		historyItems={writtenText}
		on:lineSubmit={handleLineSubmit}
		on:historyFocus={handleHistoryFocus}
		on:historyEdit={handleHistoryEdit}
	/>
</div>

<style>
	.app-container {
		position: relative;
		min-height: 100vh;
	}
</style>
