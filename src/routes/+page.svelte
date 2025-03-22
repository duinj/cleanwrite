<script lang="ts">
	import { onMount } from 'svelte';
	import History from '$lib/components/History.svelte';
	import Line from '$lib/components/Line.svelte';
	import type { HistoryItem } from '$lib/types';

	let historyItems: HistoryItem[] = [];
	let currentText = '';
	let focusedIndex: number | null = null;

	function handleSubmit(text: string) {
		if (text.trim() === '') return;

		const newItem: HistoryItem = {
			id: Date.now().toString(),
			text,
			timestamp: new Date()
		};

		historyItems = [...historyItems, newItem];
		currentText = '';
		focusedIndex = null;
	}

	function handleKeyNavigation(direction: 'up' | 'down') {
		if (historyItems.length === 0) return;

		if (direction === 'up') {
			if (focusedIndex === null) {
				focusedIndex = historyItems.length - 1;
			} else if (focusedIndex > 0) {
				focusedIndex--;
			}
		} else if (direction === 'down') {
			if (focusedIndex !== null) {
				if (focusedIndex < historyItems.length - 1) {
					focusedIndex++;
				} else {
					focusedIndex = null;
					currentText = '';
				}
			}
		}

		if (focusedIndex !== null) {
			currentText = historyItems[focusedIndex].text;
		}
	}

	onMount(() => {
		document.title = 'CleanWrite';
	});
</script>

<main class="relative flex min-h-screen flex-col items-center justify-center bg-white">
	<div class="container flex h-full w-full max-w-3xl flex-grow flex-col px-4 pt-8 pb-28">
		<div class="flex flex-grow flex-col overflow-hidden">
			<History items={historyItems} {focusedIndex} />
		</div>
	</div>

	<div class="fixed right-0 bottom-0 left-0 z-10 flex justify-center pb-8">
		<Line value={currentText} onSubmit={handleSubmit} onKeyNavigation={handleKeyNavigation} />
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			system-ui,
			sans-serif;
		background-color: white;
	}

	:global(*) {
		transition: all 0.2s ease;
	}
</style>
