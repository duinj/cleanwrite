<script lang="ts">
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

	function handleKeyDown(event: KeyboardEvent) {
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
		></textarea>
	</div>

	<div class="mx-auto mt-2 flex w-[56%] max-w-2xl justify-end">
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
	</div>
</div>

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
