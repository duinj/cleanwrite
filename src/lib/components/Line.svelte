<script lang="ts">
	import { rewriteText } from '$lib/services/gemini';
	import { isLLMLoading, hasAPIKey, initializeAPIKeyState } from '$lib/stores/gemini';
	import APIKeyModal from './APIKeyModal.svelte';

	// Check if we're in a browser environment
	const isBrowser = typeof window !== 'undefined';

	let {
		value,
		onSubmit,
		onKeyNavigation,
		onEscape,
		isEditing = false,
		focusedIndex = null
	} = $props<{
		value: string;
		onSubmit: (text: string) => void;
		onKeyNavigation: (direction: 'up' | 'down') => void;
		onEscape?: () => void;
		isEditing?: boolean;
		focusedIndex?: number | null;
	}>();

	let inputElement: HTMLTextAreaElement;
	let isFocused = false;
	let showAPIKeyModal = false;
	let isRewriting = false;
	let errorMessage = '';
	let rewriteClickable = true;

	// Initialize API key state on component mount, but only in browser
	$effect.root(() => {
		if (isBrowser) {
			console.log('Initializing API key state');
			initializeAPIKeyState();
		}
	});

	function handleRewriteClick() {
		console.log('Rewrite button clicked');
		if (rewriteClickable && value && value.trim() !== '') {
			handleLLMRewrite();
		}
	}

	async function handleLLMRewrite() {
		console.log('handleLLMRewrite called with value:', value);
		if (!value || value.trim() === '') {
			console.log('Empty text, not rewriting');
			return;
		}

		if (!$hasAPIKey) {
			console.log('No API key found, showing modal');
			showAPIKeyModal = true;
			return;
		}

		try {
			console.log('Starting rewrite process');
			isRewriting = true;
			rewriteClickable = false;
			isLLMLoading.set(true);
			errorMessage = '';

			const rewrittenText = await rewriteText(value);
			console.log('Got rewritten text:', rewrittenText);
			value = rewrittenText;

			// Make sure textarea updates its height
			setTimeout(adjustHeight, 0);
		} catch (error) {
			console.error('Error rewriting text:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to rewrite text';
		} finally {
			console.log('Rewrite process finished');
			isRewriting = false;
			isLLMLoading.set(false);
			// Allow clicking again after a short delay
			setTimeout(() => {
				rewriteClickable = true;
			}, 500);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		console.log('Key pressed:', event.key);
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			const submittedText = value;
			onSubmit(submittedText);
			value = ''; // Clear the input immediately
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			onKeyNavigation('up');
			// Set cursor to end of text after pressing up
			setTimeout(() => {
				if (inputElement) {
					inputElement.selectionStart = inputElement.value.length;
					inputElement.selectionEnd = inputElement.value.length;
				}
			}, 0);
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			onKeyNavigation('down');
			// Set cursor to end of text after pressing down
			setTimeout(() => {
				if (inputElement) {
					inputElement.selectionStart = inputElement.value.length;
					inputElement.selectionEnd = inputElement.value.length;
				}
			}, 0);
		} else if (event.key === 'Escape' && onEscape) {
			event.preventDefault();
			onEscape();
			// Ensure focus is lost after escape and update focused state immediately
			if (inputElement) {
				inputElement.blur();
				isFocused = false;
			}
		} else if (event.key === 'Tab' && !event.shiftKey) {
			console.log('Tab key pressed');
			event.preventDefault();
			if (value && value.trim() !== '' && !isRewriting && rewriteClickable) {
				console.log('Tab key will trigger rewrite');
				handleLLMRewrite();
			} else {
				console.log('Tab key conditions not met:', {
					hasValue: Boolean(value && value.trim() !== ''),
					notRewriting: !isRewriting,
					isClickable: rewriteClickable
				});
			}
		}
	}

	// Handle 'f' key globally
	function handleGlobalKeyDown(event: KeyboardEvent) {
		// Only focus if 'f' is pressed and we're not already in an input or textarea
		if (
			event.key === 'f' &&
			!isFocused &&
			!['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)
		) {
			event.preventDefault();
			if (inputElement) {
				inputElement.focus();
				isFocused = true;
			}
		}
	}

	// Auto-resize the textarea
	function adjustHeight() {
		if (inputElement) {
			inputElement.style.height = 'auto';
			inputElement.style.height = `${Math.min(inputElement.scrollHeight, 200)}px`;
		}
	}

	$effect(() => {
		adjustHeight();
	});

	// Focus the input on mount and set up window focus/blur detection
	$effect.root(() => {
		if (inputElement) {
			inputElement.focus();
		}

		// Define handlers outside of addEventListener for proper cleanup
		const handleGlobalClick = (e: MouseEvent) => {
			if (inputElement && e.target !== inputElement && !inputElement.contains(e.target as Node)) {
				isFocused = document.activeElement === inputElement;
			}
		};

		const handleFocusIn = () => {
			isFocused = document.activeElement === inputElement;
		};

		const handleFocusOut = () => {
			setTimeout(() => {
				isFocused = document.activeElement === inputElement;
			}, 10);
		};

		// Add the global keydown listener here
		window.addEventListener('keydown', handleGlobalKeyDown);
		window.addEventListener('click', handleGlobalClick);
		window.addEventListener('focusin', handleFocusIn);
		window.addEventListener('focusout', handleFocusOut);

		return () => {
			window.removeEventListener('keydown', handleGlobalKeyDown);
			window.removeEventListener('click', handleGlobalClick);
			window.removeEventListener('focusin', handleFocusIn);
			window.removeEventListener('focusout', handleFocusOut);
		};
	});

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		// Use a small delay to ensure we get the correct focus state
		setTimeout(() => {
			isFocused = document.activeElement === inputElement;
			// Force blur if we're not focused and not editing
			if (!isFocused && !isEditing && inputElement) {
				inputElement.blur();
			}
		}, 10);
	}
</script>

<div class="relative">
	<div
		class="writing-bar shadow-floating mx-auto flex w-[56%] max-w-2xl items-center rounded-full bg-white px-6 py-0.5"
		class:border-primary-subtle={isEditing}
		class:disabled={isRewriting}
	>
		<textarea
			bind:this={inputElement}
			bind:value
			on:keydown={handleKeyDown}
			on:input={adjustHeight}
			on:focus={handleFocus}
			on:blur={handleBlur}
			placeholder={isEditing ? 'Edit entry...' : 'Write something...'}
			class="max-h-[120px] min-h-[38px] w-full resize-none overflow-y-auto bg-transparent px-2 outline-none focus:outline-none"
			rows="1"
			disabled={isRewriting}
		></textarea>

		{#if isRewriting}
			<div class="rewriting-indicator ml-2 flex items-center gap-2">
				<div class="loading-spinner"></div>
				<span class="text-primary text-xs">Rewriting...</span>
			</div>
		{:else if value && value.trim() !== '' && rewriteClickable}
			<button
				on:click={handleRewriteClick}
				type="button"
				class="rewrite-button hover:text-primary ml-2 flex items-center rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-50"
				title="Rewrite with AI (Tab)"
				aria-label="Rewrite with AI"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		{/if}
	</div>

	{#if errorMessage}
		<div class="mx-auto mt-1 w-[56%] max-w-2xl">
			<p class="text-xs text-red-500">{errorMessage}</p>
		</div>
	{/if}

	<div class="mx-auto mt-2 flex w-[56%] max-w-2xl justify-end space-x-2">
		{#if isEditing}
			<div class="keyboard-key flex-row">
				<span>ESC</span>
				<div class="key-hint ml-2">cancel</div>
			</div>
		{:else if !isFocused || document.activeElement !== inputElement}
			<div class="keyboard-key flex-row">
				<span>F</span>
				<div class="key-hint ml-2">to focus</div>
			</div>
		{/if}

		{#if value && value.trim() !== '' && !isRewriting}
			<div class="keyboard-key flex-row">
				<span>TAB</span>
				<div class="key-hint ml-2">rewrite with AI</div>
			</div>
		{/if}
	</div>
</div>

<APIKeyModal bind:show={showAPIKeyModal} />

<style>
	.writing-bar {
		border: 1px solid rgba(230, 230, 230, 0.7);
		backdrop-filter: blur(8px);
		transition: all 0.2s ease;
	}

	.writing-bar:focus-within {
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
		transform: translateY(-2px);
		border-color: rgba(220, 220, 220, 1);
	}

	.writing-bar.border-primary-subtle {
		border-color: rgba(99, 102, 241, 0.3);
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
	}

	.writing-bar.disabled {
		opacity: 0.7;
		pointer-events: none;
	}

	textarea {
		border: none;
		font-family: inherit;
		line-height: 1.5;
		font-size: 0.95rem;
		padding: 9px 10px;
		color: #333;
	}

	textarea::placeholder {
		color: #9ca3af;
		opacity: 0.8;
		font-weight: 400;
	}

	.keyboard-key {
		display: flex;
		align-items: center;
		animation: pulse 2s infinite;
		background-color: rgba(243, 244, 246, 0.8);
		padding: 4px 8px;
		border-radius: 6px;
		backdrop-filter: blur(4px);
	}

	.keyboard-key span {
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		color: #4b5563;
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 600;
		min-width: 24px;
		padding: 2px 6px;
		text-align: center;
		transform: translateY(0);
		transition: all 0.1s ease;
	}

	.key-hint {
		color: #6b7280;
		font-size: 0.7rem;
		font-weight: 500;
	}

	/* Loading spinner */
	.rewriting-indicator {
		display: flex;
		align-items: center;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(99, 102, 241, 0.2);
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse {
		0% {
			opacity: 0.7;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.05);
		}
		100% {
			opacity: 0.7;
			transform: scale(1);
		}
	}
</style>
