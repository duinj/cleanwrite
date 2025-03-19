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

<div class="flex flex-grow justify-center overflow-y-auto px-4" bind:this={historyContainer}>
	<div class="w-3/4 max-w-md">
		{#if items.length === 0}
			<div class="py-16 text-center text-gray-300 italic">Begin writing...</div>
		{:else}
			<div class="flex flex-col gap-5 py-4">
				{#each items as item, i (item.id)}
					<div
						class="transform px-1 py-2 transition-all duration-200"
						class:opacity-40={focusedIndex !== null && focusedIndex !== i}
						class:border-l-2={focusedIndex === i}
						class:border-l-indigo-400={focusedIndex === i}
						class:pl-3={focusedIndex === i}
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
