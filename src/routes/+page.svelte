<script lang="ts">
	import { onMount } from 'svelte';

	let writtenText: string[] = [];
	let currentLine: string = '';
	let inputElement: HTMLInputElement;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && currentLine.trim()) {
			writtenText = [...writtenText, currentLine];
			currentLine = '';
			// Scroll to the bottom if needed
			setTimeout(() => {
				window.scrollTo(0, document.body.scrollHeight);
			}, 0);
		}
	}

	onMount(() => {
		// Focus the input field when the component is mounted
		inputElement.focus();
	});
</script>

<div class="writing-container">
	<div class="written-text">
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
		padding: 40px 20px;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.written-text {
		flex-grow: 1;
		margin-bottom: 20px;
		width: 100%;
	}

	.written-text p {
		margin: 0 0 1em 0;
		padding: 0;
		font-size: 1.1rem;
	}

	.input-line {
		position: sticky;
		bottom: 40vh;
		width: 100%;
		border-bottom: 1px solid var(--line-color);
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
