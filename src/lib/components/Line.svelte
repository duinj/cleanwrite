<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	// Component props
	let { lineText = '', historyItems = [] } = $props<{
		lineText?: string;
		historyItems: string[];
	}>();

	// DOM reference
	let textareaElement: HTMLTextAreaElement;

	// History navigation
	let historyIndex = -1; // -1 means current input (not navigating history)
	let tempCurrentInput = ''; // Store current input when navigating history
	let isNavigatingHistory = false; // Flag to indicate if we're viewing history

	// Event dispatcher to communicate with parent component
	const dispatch = createEventDispatcher<{
		lineSubmit: string;
		textChange: string;
		historyFocus: number; // Added event for history focus index
	}>();

	/**
	 * Handle keydown events on the input line
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && lineText.trim()) {
			event.preventDefault(); // Prevent default Enter behavior
			dispatch('lineSubmit', lineText);
			lineText = '';
			historyIndex = -1; // Reset history index after submission
			isNavigatingHistory = false;
			dispatch('historyFocus', -1); // Ensure focused index is reset
		} else if (event.key === 'ArrowUp' && historyItems.length > 0) {
			// Only start history navigation if we're at the beginning of the input
			// or if we're already navigating, to avoid interfering with normal cursor movement
			if (historyIndex !== -1 || textareaElement.selectionStart === 0) {
				event.preventDefault();

				// If we're not already navigating history, save current input
				if (historyIndex === -1) {
					tempCurrentInput = lineText;
				}

				// Move up in history (towards older items)
				if (historyIndex < historyItems.length - 1) {
					historyIndex++;
					lineText = historyItems[historyItems.length - 1 - historyIndex];
					isNavigatingHistory = true;
					dispatch('historyFocus', historyIndex);

					// Move cursor to end of text
					setTimeout(() => {
						if (textareaElement) {
							textareaElement.selectionStart = textareaElement.selectionEnd = lineText.length;
						}
					}, 0);
				}
			}
		} else if (event.key === 'ArrowDown') {
			// Only handle history navigation if we're already in history mode
			if (historyIndex !== -1) {
				event.preventDefault();

				// Move down in history (towards current)
				if (historyIndex > 0) {
					historyIndex--;
					lineText = historyItems[historyItems.length - 1 - historyIndex];
					dispatch('historyFocus', historyIndex);

					// Move cursor to end of text
					setTimeout(() => {
						if (textareaElement) {
							textareaElement.selectionStart = textareaElement.selectionEnd = lineText.length;
						}
					}, 0);
				} else if (historyIndex === 0) {
					// Return to current input
					historyIndex = -1;
					lineText = tempCurrentInput;
					isNavigatingHistory = false;
					dispatch('historyFocus', -1);

					// Move cursor to end of text
					setTimeout(() => {
						if (textareaElement) {
							textareaElement.selectionStart = textareaElement.selectionEnd = lineText.length;
						}
					}, 0);
				}
			}
		} else if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && historyIndex !== -1) {
			// If user starts typing while in history, return to current input
			historyIndex = -1;
			isNavigatingHistory = false;
			dispatch('historyFocus', -1);
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

	onMount(() => {
		// Ensure textarea starts with correct height
		adjustTextareaHeight();
	});
</script>

<div class="input-line" class:history-mode={isNavigatingHistory}>
	{#if isNavigatingHistory}
		<div class="history-indicator">
			<span class="history-label">History ({historyIndex + 1}/{historyItems.length})</span>
			<span class="history-nav-hint">↑ older · ↓ newer</span>
		</div>
	{/if}
	<textarea
		bind:this={textareaElement}
		bind:value={lineText}
		on:keydown={handleKeydown}
		on:input={handleInput}
		placeholder="Write here..."
		spellcheck="true"
		rows="1"
		autocomplete="off"
		class:history-view={isNavigatingHistory}
	></textarea>
</div>

<style>
	.input-line {
		position: fixed;
		top: 50%; /* Center vertically */
		left: 50%;
		transform: translate(-50%, -50%); /* Center both horizontally and vertically */
		width: calc(100% - 40px);
		max-width: 760px;
		border-bottom: 1px solid var(--line-color);
		background-color: var(--paper-color);
		padding: 0;
		z-index: 10;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.input-line.history-mode {
		background-color: rgba(248, 245, 233, 0.98);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
	}

	.history-indicator {
		position: absolute;
		top: -30px;
		left: 0;
		font-size: 0.85rem;
		color: #666;
		width: 100%;
		display: flex;
		justify-content: space-between;
		padding: 0 4px;
	}

	.history-label {
		background: rgba(0, 0, 0, 0.05);
		padding: 3px 10px;
		border-radius: 12px;
		font-weight: 500;
	}

	.history-nav-hint {
		font-size: 0.75rem;
		color: #888;
		opacity: 0.9;
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
		display: block;
		transition:
			background-color 0.2s ease,
			padding 0.2s ease;
	}

	textarea.history-view {
		background-color: rgba(0, 0, 0, 0.03);
		color: #000;
		border-radius: 4px;
		padding: 10px 12px;
		font-style: italic;
	}

	textarea::placeholder {
		color: #aaa;
		opacity: 0.7;
		line-height: 1.5;
	}
</style>
