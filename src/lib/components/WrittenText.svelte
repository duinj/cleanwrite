<script lang="ts">
	// Component props
	let { lines = [], focusedIndex = -1 } = $props<{
		lines: string[];
		focusedIndex: number;
	}>();

	// DOM references
	let writtenTextElement: HTMLDivElement;
	let fadeTopElement: HTMLDivElement;

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
</script>

<div class="writing-container">
	<div class="fade-top" bind:this={fadeTopElement}></div>
	<div class="written-text" bind:this={writtenTextElement}>
		{#each lines as line, index}
			<p class:focused={lines.length - 1 - index === focusedIndex}>{line}</p>
		{/each}
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

	.enhanced-blur {
		backdrop-filter: blur(4px);
	}

	.written-text {
		flex-grow: 1;
		width: 100%;
		margin-bottom: 60px;
		position: relative;
		padding-top: 20vh;
	}

	.written-text p {
		margin: 0 0 1em 0;
		padding: 0;
		font-size: 1.1rem;
		transition:
			opacity 0.3s ease,
			background-color 0.2s ease,
			transform 0.2s ease,
			padding 0.2s ease,
			margin 0.2s ease;
	}

	.written-text p.focused {
		background-color: rgba(0, 0, 0, 0.08);
		border-radius: 4px;
		padding: 8px 12px;
		margin-left: -12px;
		margin-right: -12px;
		transform: translateX(4px);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		position: relative;
		z-index: 2;
	}

	/* Add a subtle indicator to show this is the focused item */
	.written-text p.focused::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background-color: rgba(0, 0, 0, 0.2);
		border-top-left-radius: 4px;
		border-bottom-left-radius: 4px;
	}
</style>
