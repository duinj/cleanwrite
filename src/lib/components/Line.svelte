<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Component props
	let { lineText = '' } = $props();

	// DOM reference
	let inputElement: HTMLInputElement;

	// Event dispatcher to communicate with parent component
	const dispatch = createEventDispatcher<{
		lineSubmit: string;
		textChange: string;
	}>();

	/**
	 * Handle keydown events on the input line
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && lineText.trim()) {
			dispatch('lineSubmit', lineText);
			lineText = '';
		}
	}

	/**
	 * Focus the input element
	 */
	export function focus() {
		inputElement?.focus();
	}

	/**
	 * Handle input changes
	 */
	function handleInput() {
		dispatch('textChange', lineText);
	}
</script>

<div class="input-line">
	<input
		bind:this={inputElement}
		bind:value={lineText}
		on:keydown={handleKeydown}
		on:input={handleInput}
		placeholder="Write here..."
		spellcheck="true"
		autocomplete="off"
	/>
</div>

<style>
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
