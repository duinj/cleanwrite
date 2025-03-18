<script lang="ts">
	// Component props
	let { lines = [], focusedIndex = -1 } = $props<{
		lines: string[];
		focusedIndex: number;
	}>();

	// DOM references
	let writtenTextElement: HTMLDivElement;
	let fadeTopElement: HTMLDivElement;
	let fadeBottomElement: HTMLDivElement;

	/**
	 * Enhance blur effect temporarily
	 */
	export function enhanceBlur() {
		if (fadeTopElement) {
			fadeTopElement.classList.add('enhanced-blur');
			setTimeout(() => {
				fadeTopElement.classList.remove('enhanced-blur');
			}, 500);
		}
	}

	function getItemsAbove() {
		if (focusedIndex === -1) {
			// When not in history navigation mode, all items are above
			return lines;
		} else {
			// Get all items older than the focused item
			// Items are stored newest-to-oldest, so we need to get items from
			// the beginning of the array up to the focused item (exclusive)
			const focusedPosition = lines.length - 1 - focusedIndex;
			return lines.slice(0, focusedPosition);
		}
	}

	function getItemsBelow() {
		if (focusedIndex === -1 || focusedIndex >= lines.length) {
			// When not in history navigation mode, no items are below
			return [];
		} else {
			// Get all items newer than the focused item
			// Items are stored newest-to-oldest, so we need to get items after
			// the focused position. We want to display them from newest to oldest
			// (the same as they were typed) with the most recent just below the focus
			const focusedPosition = lines.length - 1 - focusedIndex;
			return lines.slice(focusedPosition + 1);
		}
	}

	function getFocusedItem() {
		if (focusedIndex === -1 || focusedIndex >= lines.length) {
			return null;
		}
		return lines[lines.length - 1 - focusedIndex];
	}
</script>

<div class="writing-container">
	<div class="fade-top" bind:this={fadeTopElement}></div>

	<!-- Items displayed ABOVE the input line (older items) -->
	<div class="written-text above" bind:this={writtenTextElement}>
		{#each getItemsAbove() as line}
			<p>{line}</p>
		{/each}
	</div>

	<!-- The middle area is where the input line sits -->
	<div class="middle-space">
		{#if focusedIndex !== -1}
			<div class="focused-indicator">
				<div class="focused-line"></div>
			</div>
		{/if}
	</div>

	<!-- Items displayed BELOW the input line (newer items) -->
	{#if focusedIndex !== -1 && getItemsBelow().length > 0}
		<div class="written-text below">
			{#each getItemsBelow() as line}
				<p>{line}</p>
			{/each}
		</div>

		<!-- Bottom fade effect when showing items below -->
		<div class="fade-bottom" bind:this={fadeBottomElement}></div>
	{/if}
</div>

<style>
	.writing-container {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: 40px 20px 0 20px;
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
		height: 15vh;
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

	.fade-bottom {
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 800px;
		height: 15vh;
		background: linear-gradient(
			to top,
			var(--paper-color) 0%,
			var(--paper-color) 30%,
			var(--fade-color-light) 80%,
			var(--fade-color-transparent) 100%
		);
		z-index: 5;
		pointer-events: none;
		backdrop-filter: blur(2px);
		opacity: 0.85;
	}

	.enhanced-blur {
		backdrop-filter: blur(4px);
	}

	.written-text {
		width: 100%;
		position: relative;
		transition: opacity 0.3s ease;
	}

	.written-text.above {
		flex-grow: 1;
		padding-top: 20vh;
		padding-bottom: 15vh; /* Space above the input line */
	}

	.written-text.below {
		padding-top: 15vh; /* Space below the input line */
		padding-bottom: 20vh;
		margin-top: 3vh;
		border-top: 1px dashed rgba(0, 0, 0, 0.05);
	}

	.middle-space {
		height: 20vh; /* Space for the input line */
		min-height: 60px;
		position: relative;
	}

	.focused-indicator {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		display: flex;
		justify-content: center;
	}

	.focused-line {
		width: 50px;
		height: 2px;
		background-color: rgba(0, 0, 0, 0.1);
	}

	.written-text p {
		margin: 0 0 1em 0;
		padding: 0;
		font-size: 1.1rem;
		transition:
			opacity 0.3s ease,
			visibility 0.3s ease;
	}
</style>
