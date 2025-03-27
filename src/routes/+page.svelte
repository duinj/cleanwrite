<script lang="ts">
	import { onMount } from 'svelte';
	import History from '$lib/components/History.svelte';
	import Line from '$lib/components/Line.svelte';
	import type { HistoryItem } from '$lib/types';
	import { addToContext, setHistoryAsContext } from '$lib/stores/context';

	let historyItems: HistoryItem[] = [];
	let currentText = '';
	let focusedIndex: number | null = null;
	let isEditing = false;

	function handleSubmit(text: string) {
		if (text.trim() === '') return;

		if (isEditing && focusedIndex !== null) {
			console.log('Updating item at index:', focusedIndex, 'with text:', text);
			historyItems = historyItems.map((item, i) => (i === focusedIndex ? { ...item, text } : item));
			// After editing, update the context with all items
			setHistoryAsContext(historyItems);
			resetState();
		} else {
			const newItem: HistoryItem = {
				id: Date.now().toString(),
				text,
				timestamp: new Date()
			};
			console.log('Adding new item:', { text, id: newItem.id });
			console.log(
				'History before add:',
				historyItems.map((item) => ({ id: item.id, text: item.text }))
			);
			historyItems = [...historyItems, newItem];
			console.log(
				'History after add:',
				historyItems.map((item) => ({ id: item.id, text: item.text }))
			);

			// Add to context
			addToContext(text);

			resetState();
		}
	}

	function resetState() {
		console.log('Resetting state - clearing focus and text');
		currentText = '';
		focusedIndex = null;
		isEditing = false;
	}

	function handleKeyNavigation(direction: 'up' | 'down') {
		if (historyItems.length === 0) return;

		const lastIndex = historyItems.length - 1;

		console.groupCollapsed(`Navigation: ${direction.toUpperCase()}`);
		console.log('Initial state:', {
			focusedIndex,
			historyItems: historyItems.map((item) => item.text),
			currentText,
			isEditing
		});

		if (direction === 'up') {
			if (focusedIndex === null) {
				console.log('Starting navigation from bottom (newest item)');
				focusedIndex = lastIndex;
				isEditing = true;
			} else if (focusedIndex > 0) {
				console.log(`Moving up from index ${focusedIndex} to ${focusedIndex - 1}`);
				focusedIndex--;
				isEditing = true;
			} else {
				console.log('Already at oldest item (index 0)');
			}
		} else if (direction === 'down') {
			if (focusedIndex !== null) {
				if (focusedIndex < lastIndex) {
					console.log(`Moving down from index ${focusedIndex} to ${focusedIndex + 1}`);
					focusedIndex++;
					isEditing = true;
				} else {
					console.log('Reached newest item - exiting edit mode');
					resetState();
				}
			}
		}

		if (focusedIndex !== null) {
			currentText = historyItems[focusedIndex].text;
			console.log('New focused item:', {
				index: focusedIndex,
				text: currentText,
				id: historyItems[focusedIndex].id
			});
		} else {
			console.log('No focused item - clean state');
		}

		console.groupEnd();
	}

	function handleEscape() {
		resetState();
	}

	onMount(() => {
		document.title = 'CleanWrite';

		// Initialize context with any existing history items when the app loads
		if (historyItems.length > 0) {
			setHistoryAsContext(historyItems);
		}
	});
</script>

<main class="relative min-h-screen bg-white">
	<div class="container mx-auto pt-4">
		<div class="h-[calc(50vh-80px)] overflow-hidden">
			<History items={historyItems} {focusedIndex} {isEditing} />
		</div>
	</div>

	<div
		class="fixed top-1/2 right-0 left-0 z-10 flex w-full -translate-y-1/2 transform flex-col justify-center"
	>
		<Line
			value={currentText}
			onSubmit={handleSubmit}
			onKeyNavigation={handleKeyNavigation}
			onEscape={handleEscape}
			{isEditing}
			{focusedIndex}
		/>
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
