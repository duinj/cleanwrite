<script lang="ts">
	import { onMount } from 'svelte';

	let writtenText: string[] = [];
	let currentLine: string = '';
	let inputElement: HTMLInputElement;
	let writtenTextElement: HTMLDivElement;
	let writingContainer: HTMLDivElement;
	let fadeTopElement: HTMLDivElement;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && currentLine.trim()) {
			writtenText = [...writtenText, currentLine];
			currentLine = '';

			// Reset the scroll position after DOM update
			setTimeout(() => {
				// Calculate the height to position the latest entry just above the input line
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

				// Enhance blur effect briefly when new text is added
				if (fadeTopElement) {
					fadeTopElement.classList.add('enhanced-blur');
					setTimeout(() => {
						fadeTopElement.classList.remove('enhanced-blur');
					}, 500);
				}
			}, 10);
		}
	}

	onMount(() => {
		// Focus the input field when the component is mounted
		inputElement.focus();
	});
</script>

<div class="writing-container" bind:this={writingContainer}>
	<div class="fade-top" bind:this={fadeTopElement}></div>
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
		padding: 40px 20px 50vh 20px;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.fade-top {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 800px;
		height: 15vh; /* Reduced height to start the fade higher */
		background: linear-gradient(
			to bottom,
			var(--paper-color) 0%,
			var(--paper-color) 30%,
			var(--fade-color-light) 80%,
			var(--fade-color-transparent) 100%
		);
		z-index: 5;
		pointer-events: none;
		backdrop-filter: blur(2px);
		transition: backdrop-filter 0.3s ease;
	}

	.enhanced-blur {
		backdrop-filter: blur(4px);
	}

	.written-text {
		flex-grow: 1;
		width: 100%;
		margin-bottom: 60px;
		position: relative;
		padding-top: 20vh; /* Increased padding to push first entered text below the blur */
	}

	.written-text p {
		margin: 0 0 1em 0;
		padding: 0;
		font-size: 1.1rem;
		transition: opacity 0.3s ease;
	}

	.input-line {
		position: fixed;
		bottom: 35vh;
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
