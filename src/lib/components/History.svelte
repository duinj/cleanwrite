<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { HistoryItem } from '$lib/types';

	let { items, focusedIndex } = $props<{
		items: HistoryItem[];
		focusedIndex: number | null;
	}>();

	$effect(() => {
		// When a new item is added, scroll to the bottom
		if (historyContainer && items.length > 0 && focusedIndex === null) {
			historyContainer.scrollTop = historyContainer.scrollHeight;
		}
	});

	let historyContainer: HTMLDivElement;
</script>

<div class="flex flex-grow justify-center overflow-y-auto" bind:this={historyContainer}>
	<div class="mx-auto w-[60%]">
		{#if items.length === 0}
			<div class="flex h-full items-center justify-center">
				<div class="py-16 text-center text-gray-300 italic"></div>
			</div>
		{:else}
			<div class="flex flex-col gap-6 py-4">
				{#each items as item, i (item.id)}
					<div
						class="transform rounded-lg px-4 py-3 text-center transition-all duration-200"
						class:opacity-40={focusedIndex !== null && focusedIndex !== i}
						class:bg-gray-50={focusedIndex === i}
						class:shadow-sm={focusedIndex === i}
						in:fly={{ y: 15, duration: 200 }}
					>
						<p class="leading-relaxed break-words whitespace-pre-wrap">
							{item.text}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	div :global(p) {
		margin: 0;
		line-height: 1.7;
	}
</style>
