import { writable, get } from 'svelte/store';
import type { HistoryItem } from '$lib/types';

interface WritingContext {
	items: string[];
	tone: string | null;
}

// Store for managing writing context
export const writingContext = writable<WritingContext>({
	items: [],
	tone: null
});

// Add text to the context
export function addToContext(text: string): void {
	if (!text || text.trim() === '') return;

	writingContext.update((ctx) => ({
		...ctx,
		items: [...ctx.items, text.trim()]
	}));
}

// Check if we have any context
export function hasContext(): boolean {
	return get(writingContext).items.length > 0;
}

// Clear the context
export function clearContext(): void {
	writingContext.set({
		items: [],
		tone: null
	});
}

// Set the history items as context
export function setHistoryAsContext(items: HistoryItem[]): void {
	const textItems = items.map((item) => item.text);
	writingContext.update((ctx) => ({
		...ctx,
		items: textItems
	}));
}

// Set the writing tone
export function setTone(tone: string): void {
	writingContext.update((ctx) => ({
		...ctx,
		tone
	}));
}

// Get the current tone
export function getCurrentTone(): string | null {
	return get(writingContext).tone;
}

// Get all context as a string for prompt construction
export function getContextString(): string {
	const ctx = get(writingContext);

	if (ctx.items.length === 0) {
		return '';
	}

	return ctx.items.join('\n\n');
}
