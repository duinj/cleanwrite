<script lang="ts">
	import { onMount } from 'svelte';

	let writtenText: string[] = [];
	let currentLine: string = '';
	let inputElement: HTMLInputElement;
	let writtenTextElement: HTMLDivElement;
	let writingContainer: HTMLDivElement;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && currentLine.trim()) {
			writtenText = [...writtenText, currentLine];
			currentLine = '';

			// Reset the scroll position after DOM update
			setTimeout(() => {
				// Calculate the height to position the latest entry just above the input line
				const viewportHeight = window.innerHeight;
				const scrollPosition = document.body.scrollHeight - viewportHeight * 0.65;
				window.scrollTo(0, scrollPosition);
			}, 10);
		}
	}

	onMount(() => {
		// Focus the input field when the component is mounted
		inputElement.focus();
	});
</script>

<div class="writing-container" bind:this={writingContainer}>
	<div class="written-text" bind:this={writtenTextElement}>
		{#each writtenText as line}
			<p>{line}</p>
		{/each}
	</div>

	<div class="input-line">
		<input
			bind:this={inputElement}
			bind:value={currentLine}
			on:keydown={handleKeydown}
			placeholder="Write here..."
			spellcheck="true"
			autocomplete="off"
		/>
	</div>
</div>

<style>
	.writing-container {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: 40px 20px 50vh 20px; /* Adjusted bottom padding */
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.written-text {
		flex-grow: 1;
		width: 100%;
		margin-bottom: 60px; /* Reduced space between written text and input line */
	}

	.written-text p {
		margin: 0 0 1em 0;
		padding: 0;
		font-size: 1.1rem;
	}

	.input-line {
		position: fixed;
		bottom: 35vh; /* Position lower on the screen */
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 40px);
		max-width: 760px;
		border-bottom: 1px solid var(--line-color);
		background-color: var(--paper-color);
		padding: 10px 0;
		z-index: 10;
	}

	input {
		width: 100%;
		padding: 8px 0;
		border: none;
		background: transparent;
		font-family: inherit;
		font-size: 1.1rem;
		color: inherit;
		outline: none;
	}

	input::placeholder {
		color: #aaa;
		opacity: 0.7;
	}
</style>
