<script lang="ts">
	import { onMount } from 'svelte';

	// DOM references
	let containerElement: HTMLDivElement;
	let inputElement: HTMLTextAreaElement;
	let fadeTopElement: HTMLDivElement;
	let fadeBottomElement: HTMLDivElement;
	let contentElement: HTMLDivElement;

	// State
	let writtenLines: string[] = [];
	let currentInput: string = '';
	let historyIndex: number = -1;
	let tempInputBeforeHistory: string = '';
	let isViewingHistory: boolean = false;

	// Create a reactive list that orders lines correctly - newest last (closest to input)
	$: displayedLines = isViewingHistory
		? [...writtenLines].filter((_, i) => i !== writtenLines.length - 1 - historyIndex) // remove currently focused line
		: [...writtenLines];

	$: currentFocusedLine = isViewingHistory
		? writtenLines[writtenLines.length - 1 - historyIndex]
		: '';

	/**
	 * Handle when a line is submitted (Enter key)
	 */
	function handleSubmit() {
		if (!currentInput.trim()) return;

		// Add to written lines
		writtenLines = [...writtenLines, currentInput];

		// Reset state
		currentInput = '';
		historyIndex = -1;
		tempInputBeforeHistory = '';
		isViewingHistory = false;

		// Adjust input height
		adjustInputHeight();

		// Update positioning after DOM update
		setTimeout(() => {
			resetCarouselPosition();
			enhanceBlur();
		}, 10);
	}

	/**
	 * Handle keyboard navigation
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && currentInput.trim()) {
			event.preventDefault();
			handleSubmit();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			navigateHistory('up');
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			navigateHistory('down');
		}
	}

	/**
	 * Navigate through history
	 */
	function navigateHistory(direction: 'up' | 'down') {
		if (direction === 'up') {
			// First arrow up press, save current input
			if (historyIndex === -1 && currentInput) {
				tempInputBeforeHistory = currentInput;
			}

			// Navigate up if we have history
			if (historyIndex < writtenLines.length - 1) {
				historyIndex++;
				currentInput = writtenLines[writtenLines.length - 1 - historyIndex];
				isViewingHistory = true;

				// Position content after state updates
				setTimeout(() => positionCarousel(), 0);
			}
		} else {
			// direction === 'down'
			if (historyIndex > 0) {
				historyIndex--;
				currentInput = writtenLines[writtenLines.length - 1 - historyIndex];
				isViewingHistory = true;

				// Position content after state updates
				setTimeout(() => positionCarousel(), 0);
			} else if (historyIndex === 0) {
				// Return to the original input
				historyIndex = -1;
				currentInput = tempInputBeforeHistory || '';
				tempInputBeforeHistory = '';
				isViewingHistory = false;
				resetCarouselPosition();
			}
		}

		// Adjust input height and place cursor at end
		setTimeout(() => {
			adjustInputHeight();
			if (inputElement) {
				inputElement.selectionStart = inputElement.selectionEnd = currentInput.length;
			}
		}, 0);
	}

	/**
	 * Position the content for carousel effect
	 */
	function positionCarousel() {
		if (!contentElement || !inputElement) return;

		const viewportHeight = window.innerHeight;
		const inputRect = inputElement.getBoundingClientRect();
		const inputCenterY = inputRect.top + inputRect.height / 2;
		const smallGap = 10; // Small gap between lines

		if (historyIndex >= 0) {
			// Reset any previous styles
			contentElement.style.position = 'relative';
			contentElement.style.top = 'auto';
			contentElement.style.transform = 'none';
			contentElement.style.paddingBottom = '0';

			// Calculate visible index
			const selectedIndex = writtenLines.length - 1 - historyIndex;

			// Apply a class to make it easier to style
			contentElement.classList.add('carousel-active');

			// Adjust the padding to create space for the input line
			// This should move content up just enough so the input appears in the flow
			contentElement.style.paddingBottom = `${inputRect.height + smallGap * 2}px`;

			// Scroll the window so the input is centered
			window.scrollTo({
				top: Math.max(0, document.body.scrollHeight - viewportHeight / 2 - inputRect.height),
				behavior: 'smooth'
			});
		}
	}

	/**
	 * Reset carousel position
	 */
	function resetCarouselPosition() {
		if (contentElement) {
			contentElement.classList.remove('carousel-active');
			contentElement.style.position = '';
			contentElement.style.top = '';
			contentElement.style.transform = '';
			contentElement.style.paddingBottom = '';
		}
	}

	/**
	 * Handle input changes
	 */
	function handleInput() {
		// If editing after using history, clear history state
		if (historyIndex >= 0) {
			historyIndex = -1;
			isViewingHistory = false;
			resetCarouselPosition();
		}

		adjustInputHeight();
	}

	/**
	 * Adjust textarea height to fit content
	 */
	function adjustInputHeight() {
		if (inputElement) {
			inputElement.style.height = 'auto';
			inputElement.style.height = inputElement.scrollHeight + 'px';
		}
	}

	/**
	 * Enhance blur effect temporarily
	 */
	function enhanceBlur() {
		if (fadeTopElement) {
			fadeTopElement.classList.add('enhanced-blur');
			fadeTopElement.classList.add('funnel-animation');
			setTimeout(() => {
				fadeTopElement.classList.remove('enhanced-blur');
				fadeTopElement.classList.remove('funnel-animation');
			}, 500);
		}
	}

	// Initialize
	onMount(() => {
		// Focus the input field
		inputElement?.focus();

		// Ensure input has correct height
		adjustInputHeight();
	});
</script>

<div class="editor-container" bind:this={containerElement}>
	<div class="fade-top" bind:this={fadeTopElement}></div>
	<div class="fade-bottom" bind:this={fadeBottomElement}></div>

	<div class="content-wrapper">
		<div
			class="written-content"
			bind:this={contentElement}
			class:viewing-history={isViewingHistory}
		>
			<!-- Display lines in reverse order - most recent at bottom, closest to input -->
			{#if displayedLines.length > 0}
				{#each [...displayedLines].reverse() as line}
					<p>{line}</p>
				{/each}
			{/if}
		</div>
	</div>

	<div
		class="input-line"
		class:viewing-history={isViewingHistory}
		class:empty={!currentInput.trim()}
	>
		{#if isViewingHistory}
			<div class="history-indicator">
				↑ Viewing history ({historyIndex + 1}/{writtenLines.length})
			</div>
		{/if}
		<textarea
			bind:this={inputElement}
			bind:value={currentInput}
			on:keydown={handleKeydown}
			on:input={handleInput}
			placeholder="Write here..."
			spellcheck="true"
			rows="1"
			autocomplete="off"
		></textarea>
	</div>
</div>

<style>
	.editor-container {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: 10vh 20px 30vh 20px;
		min-height: 100vh;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.content-wrapper {
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.written-content {
		width: 100%;
		transition: all 0.3s ease;
	}

	.written-content.viewing-history {
		margin-top: auto;
	}

	.written-content p {
		margin: 0 0 1em 0;
		padding: 8px 0;
		font-size: 1.1rem;
		line-height: 1.5;
		transition: all 0.3s ease;
	}

	.viewing-history p:last-child {
		margin-bottom: 0.5em;
	}

	.carousel-active p:last-child {
		position: relative;
	}

	.fade-top,
	.fade-bottom {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 800px;
		height: 20vh;
		pointer-events: none;
		backdrop-filter: blur(2px);
		transition: all 0.3s ease;
		z-index: 5;
	}

	.fade-top {
		top: 0;
		background: linear-gradient(
			to bottom,
			var(--paper-color) 0%,
			var(--paper-color) 30%,
			var(--fade-color-light) 80%,
			var(--fade-color-transparent) 100%
		);
		clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
	}

	.fade-bottom {
		bottom: 0;
		background: linear-gradient(
			to top,
			var(--paper-color) 0%,
			var(--paper-color) 30%,
			var(--fade-color-light) 80%,
			var(--fade-color-transparent) 100%
		);
	}

	.enhanced-blur {
		backdrop-filter: blur(4px);
	}

	.funnel-animation {
		clip-path: polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%);
	}

	.input-line {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: calc(100% - 40px);
		max-width: 760px;
		border-bottom: 1px solid var(--line-color);
		background-color: var(--paper-color);
		padding: 0;
		z-index: 10;
		transition: all 0.3s ease;
		margin-top: 0;
	}

	.input-line.viewing-history {
		background-color: rgba(255, 255, 220, 0.5);
		border-radius: 4px;
		border-bottom: 1px solid #e0dcc5;
		padding: 10px;
	}

	.history-indicator {
		font-size: 0.8rem;
		color: #988;
		margin-bottom: 5px;
		text-align: right;
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
		overflow: hidden;
		min-height: 1.5em;
		line-height: 1.5;
		display: block;
	}

	.viewing-history textarea {
		padding: 0;
	}

	textarea::placeholder {
		color: #aaa;
		opacity: 0.7;
		line-height: 1.5;
	}
</style>
