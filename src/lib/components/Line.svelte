<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Component props
	let { lineText = '' } = $props();

	// DOM reference
	let textareaElement: HTMLTextAreaElement;

	// Event dispatcher to communicate with parent component
	const dispatch = createEventDispatcher<{
		lineSubmit: string;
		textChange: string;
	}>();

	/**
	 * Handle keydown events on the input line
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && lineText.trim()) {
			event.preventDefault(); // Prevent default Enter behavior
			dispatch('lineSubmit', lineText);
			lineText = '';
		}
	}

	/**
	 * Focus the input element
	 */
	export function focus() {
		textareaElement?.focus();
	}

	/**
	 * Handle input changes
	 */
	function handleInput() {
		dispatch('textChange', lineText);
		// Auto-resize the textarea
		adjustTextareaHeight();
	}

	/**
	 * Adjust textarea height to fit content
	 */
	function adjustTextareaHeight() {
		if (textareaElement) {
			// Reset height first
			textareaElement.style.height = 'auto';
			// Then set height to scrollHeight
			textareaElement.style.height = textareaElement.scrollHeight + 'px';
		}
	}
</script>

<div class="input-line">
	<textarea
		bind:this={textareaElement}
		bind:value={lineText}
		on:keydown={handleKeydown}
		on:input={handleInput}
		placeholder="Write here..."
		spellcheck="true"
		rows="1"
		autocomplete="off"
	></textarea>
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

	textarea {
		width: 100%;
		padding: 8px 0;
		border: none;
		background: transparent;
		font-family: inherit;
		font-size: 1.1rem;
		color: inherit;
		outline: none;
		resize: none;
		overflow: hidden; /* Hide scrollbar */
		min-height: 1.5em;
		line-height: 1.5;
	}

	textarea::placeholder {
		color: #aaa;
		opacity: 0.7;
	}
</style>
