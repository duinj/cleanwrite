<script lang="ts">
	import { onMount } from 'svelte';
	import Line from '$lib/components/Line.svelte';
	import WrittenText from '$lib/components/WrittenText.svelte';

	let writtenText: string[] = [];
	let lineComponent: Line;
	let writtenTextComponent: WrittenText;

	/**
	 * Handle when a line is submitted from the Line component
	 */
	function handleLineSubmit(event: CustomEvent<string>) {
		writtenText = [...writtenText, event.detail];

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

	onMount(() => {
		// Focus the input field when the component is mounted
		lineComponent.focus();
	});
</script>

<WrittenText lines={writtenText} bind:this={writtenTextComponent} />
<Line bind:this={lineComponent} on:lineSubmit={handleLineSubmit} />
