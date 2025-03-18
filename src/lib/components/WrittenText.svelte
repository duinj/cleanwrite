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
			background-color 0.2s ease;
	}

	.written-text p.focused {
		background-color: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
		padding: 4px 8px;
		margin-left: -8px;
		margin-right: -8px;
	}
</style>
