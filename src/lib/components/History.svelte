<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { HistoryItem } from '$lib/types';

	let {
		items,
		focusedIndex,
		isEditing = false
	} = $props<{
		items: HistoryItem[];
		focusedIndex: number | null;
		isEditing?: boolean;
	}>();

	$effect(() => {
		if (!historyContainer) return;

		// When a new item is added, scroll to the bottom
		if (items.length > 0 && focusedIndex === null) {
			setTimeout(() => {
				historyContainer.scrollTop = historyContainer.scrollHeight;
			}, 10);
		}
		// When navigating with arrow keys, ensure the focused item is visible
		else if (focusedIndex !== null && items.length > 0) {
			setTimeout(() => {
				const focusedElement = document.getElementById(`history-item-${focusedIndex}`);
				if (focusedElement) {
					// Scroll the element into view with some padding
					focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				}
			}, 10);
		}
	});

	let historyContainer: HTMLDivElement;
</script>

<div class="h-full w-full overflow-y-auto" bind:this={historyContainer}>
	<div class="mx-auto w-[56%] max-w-2xl py-4">
		{#if items.length === 0}
			<div class="flex h-full items-center justify-center">
				<div class="text-gray-300 italic"></div>
			</div>
		{:else}
			<div class="flex flex-col gap-6">
				{#each items as item, i (item.id)}
					<div
						id="history-item-{i}"
						class="relative transform rounded-lg px-4 py-3 transition-all duration-200"
						class:opacity-40={focusedIndex !== null && focusedIndex !== i}
						class:focused-item={focusedIndex === i}
						class:editing={focusedIndex === i && isEditing}
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

	.focused-item {
		background-color: rgba(249, 250, 251, 0.8);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		transform: scale(1.01);
	}

	.editing {
		background-color: rgba(240, 242, 255, 0.8);
		box-shadow:
			0 0 0 1px rgba(99, 102, 241, 0.15),
			0 6px 16px rgba(0, 0, 0, 0.05);
	}
</style>
