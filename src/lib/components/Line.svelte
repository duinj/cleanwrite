<script lang="ts">
	import { rewriteText } from '$lib/services/gemini';
	import { isLLMLoading, hasAPIKey, initializeAPIKeyState } from '$lib/stores/gemini';
	import APIKeyModal from './APIKeyModal.svelte';
	import { onMount } from 'svelte';

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
	let showSlashMenu = false;
	let slashMenuPosition = { top: 0, left: 0 };
	// Track the currently selected menu item
	let selectedMenuIndex = 0;
	// Store menu element reference
	let slashMenuElement: HTMLElement | null = null;
	let slashMenuOptions: HTMLElement[] = [];

	// Initialize API key state on component mount, but only in browser
	$effect.root(() => {
		if (isBrowser) {
			initializeAPIKeyState();
		}
	});

	function handleRewriteClick() {
		if (rewriteClickable && value && value.trim() !== '') {
			handleLLMRewrite();
		}
	}

	async function handleLLMRewrite() {
		if (!value || value.trim() === '') {
			return;
		}

		if (!$hasAPIKey) {
			showAPIKeyModal = true;
			return;
		}

		try {
			isRewriting = true;
			rewriteClickable = false;
			isLLMLoading.set(true);
			errorMessage = '';

			const rewrittenText = await rewriteText(value);
			value = rewrittenText;

			// Make sure textarea updates its height
			setTimeout(adjustHeight, 10);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to rewrite text';
		} finally {
			isRewriting = false;
			isLLMLoading.set(false);
			// Allow clicking again after a short delay
			setTimeout(() => {
				rewriteClickable = true;
				// Adjust height again to be safe
				adjustHeight();
			}, 500);
		}
	}

	// Watch for input changes - simplified
	function handleInput() {
		adjustHeight();
		// Check for slash command only at beginning of input
		if (value === '/') {
			console.log('Slash detected in input, showing menu');
			createDirectSlashMenu();
			selectedMenuIndex = 0;
		} else if (value && value.startsWith('/') && value.length > 1) {
			// User is typing after slash, close the menu
			removeDirectSlashMenu();
		} else if (!value || !value.startsWith('/')) {
			removeDirectSlashMenu();
		}
	}

	// DOM-based direct slash menu implementation
	function createDirectSlashMenu() {
		// Remove any existing menu first
		removeDirectSlashMenu();

		// Get cursor position for menu placement
		if (inputElement) {
			// Calculate cursor position
			const cursorPos = inputElement.selectionStart || 0;

			// Get position of the input element
			const rect = inputElement.getBoundingClientRect();

			// Create a new menu
			const menu = document.createElement('div');
			menu.id = 'direct-slash-menu';
			menu.style.position = 'fixed';
			menu.style.top = `${rect.bottom + 10}px`; // Position below the input line
			menu.style.left = `${rect.left + 30}px`; // Position at approximate slash position
			menu.style.width = '300px';
			menu.style.backgroundColor = 'white';
			menu.style.border = '2px solid #60a5fa';
			menu.style.borderRadius = '8px';
			menu.style.padding = '12px';
			menu.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
			menu.style.zIndex = '99999';

			// Store the menu element reference
			slashMenuElement = menu;
			slashMenuOptions = [];

			// Header
			const header = document.createElement('div');
			header.textContent = 'Slash Commands';
			header.style.fontSize = '16px';
			header.style.fontWeight = 'bold';
			header.style.marginBottom = '10px';
			header.style.padding = '4px 8px';
			header.style.color = '#374151';
			menu.appendChild(header);

			// Options - Length
			const lengthOption = createMenuOption(
				'Length',
				'(coming soon)',
				() => {
					removeDirectSlashMenu();
				},
				0
			);
			menu.appendChild(lengthOption);
			slashMenuOptions.push(lengthOption);

			// Options - Tone
			const toneOption = createMenuOption(
				'Tone',
				'(coming soon)',
				() => {
					removeDirectSlashMenu();
				},
				1
			);
			menu.appendChild(toneOption);
			slashMenuOptions.push(toneOption);

			// Options - Rewrite
			const rewriteOption = createMenuOption(
				'Rewrite',
				'',
				() => {
					removeDirectSlashMenu();
					handleLLMRewrite();
				},
				2
			);
			menu.appendChild(rewriteOption);
			slashMenuOptions.push(rewriteOption);

			// Set initial selection
			updateSelectedMenuItem();

			// Overlay background - make it transparent to clicks except for the menu
			const overlay = document.createElement('div');
			overlay.id = 'direct-slash-menu-overlay';
			overlay.style.position = 'fixed';
			overlay.style.top = '0';
			overlay.style.left = '0';
			overlay.style.right = '0';
			overlay.style.bottom = '0';
			overlay.style.backgroundColor = 'transparent';
			overlay.style.zIndex = '99998';

			// Close menu when clicking outside
			overlay.addEventListener('click', removeDirectSlashMenu);

			// Add to document
			document.body.appendChild(overlay);
			document.body.appendChild(menu);
		}
	}

	function createMenuOption(label: string, subtitle: string, onClick: () => void, index: number) {
		const option = document.createElement('div');
		option.style.padding = '8px 12px';
		option.style.margin = '4px 0';
		option.style.borderRadius = '4px';
		option.style.cursor = 'pointer';
		option.style.display = 'flex';
		option.style.alignItems = 'center';
		option.setAttribute('data-index', index.toString());

		// Hover effect
		option.addEventListener('mouseover', () => {
			selectedMenuIndex = index;
			updateSelectedMenuItem();
		});

		// Label
		const labelEl = document.createElement('span');
		labelEl.textContent = label;
		labelEl.style.fontSize = '14px';
		labelEl.style.fontWeight = '500';
		option.appendChild(labelEl);

		// Subtitle if provided
		if (subtitle) {
			const subtitleEl = document.createElement('span');
			subtitleEl.textContent = subtitle;
			subtitleEl.style.fontSize = '12px';
			subtitleEl.style.color = '#6b7280';
			subtitleEl.style.marginLeft = '8px';
			option.appendChild(subtitleEl);
		}

		// Click handler
		option.addEventListener('click', onClick);

		return option;
	}

	function updateSelectedMenuItem() {
		if (slashMenuOptions) {
			slashMenuOptions.forEach((option, index) => {
				if (index === selectedMenuIndex) {
					option.style.backgroundColor = '#f3f4f6';
				} else {
					option.style.backgroundColor = 'transparent';
				}
			});
		}
	}

	function selectCurrentMenuItem() {
		if (slashMenuOptions && slashMenuOptions[selectedMenuIndex]) {
			// Trigger the click handler of the selected item
			slashMenuOptions[selectedMenuIndex].click();
		}
	}

	function removeDirectSlashMenu() {
		const menu = document.getElementById('direct-slash-menu');
		const overlay = document.getElementById('direct-slash-menu-overlay');

		if (menu) {
			document.body.removeChild(menu);
		}
		if (overlay) {
			document.body.removeChild(overlay);
		}

		slashMenuElement = null;
		slashMenuOptions = [];
	}

	// Handle key press for slash and escape to close
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();

			// If slash menu is open, select the current menu item
			if (slashMenuElement) {
				selectCurrentMenuItem();
				return;
			}

			const submittedText = value;
			onSubmit(submittedText);
			value = ''; // Clear the input immediately
			removeDirectSlashMenu();
		} else if (event.key === 'ArrowUp') {
			// If slash menu is open, navigate up in the menu
			if (slashMenuElement) {
				event.preventDefault();
				selectedMenuIndex = Math.max(0, selectedMenuIndex - 1);
				updateSelectedMenuItem();
				return;
			}

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
			// If slash menu is open, navigate down in the menu
			if (slashMenuElement) {
				event.preventDefault();
				selectedMenuIndex = Math.min(slashMenuOptions.length - 1, selectedMenuIndex + 1);
				updateSelectedMenuItem();
				return;
			}

			event.preventDefault();
			onKeyNavigation('down');
			// Set cursor to end of text after pressing down
			setTimeout(() => {
				if (inputElement) {
					inputElement.selectionStart = inputElement.value.length;
					inputElement.selectionEnd = inputElement.value.length;
				}
			}, 0);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			removeDirectSlashMenu();
			if (onEscape) {
				onEscape();
				// Ensure focus is lost after escape and update focused state immediately
				if (inputElement) {
					inputElement.blur();
					isFocused = false;
				}
			}
		} else if (event.key === 'Tab' && !event.shiftKey) {
			event.preventDefault();
			if (value && value.trim() !== '' && !isRewriting && rewriteClickable) {
				handleLLMRewrite();
			}
			removeDirectSlashMenu();
		} else if (event.key === '/') {
			// Direct keyboard handling of slash to show menu immediately
			if (inputElement.selectionStart === 0 || value === '') {
				// Allow the slash character to be added to the input
				setTimeout(() => {
					console.log('Slash key pressed, showing menu');
					createDirectSlashMenu();
				}, 10);
			}
		}
	}

	// Cleanup on component unmount
	onMount(() => {
		return () => {
			removeDirectSlashMenu();
		};
	});

	// Auto-resize the textarea
	function adjustHeight() {
		if (!inputElement) return;

		// Reset height first to calculate the proper scrollHeight
		inputElement.style.height = 'auto';

		// Set a minimum height and cap the maximum height
		const newHeight = Math.max(38, Math.min(inputElement.scrollHeight, 200));
		inputElement.style.height = `${newHeight}px`;
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

	function handleSlashCommand(command: string) {
		showSlashMenu = false;
		if (command === 'rewrite') {
			handleLLMRewrite();
		}
		// Length and tone commands don't do anything yet
	}
</script>

<div class="relative">
	<div
		class="writing-bar shadow-floating relative mx-auto flex w-[56%] max-w-2xl items-center rounded-full bg-white px-6 py-0.5"
		class:border-primary-subtle={isEditing}
		class:disabled={isRewriting}
	>
		<textarea
			bind:this={inputElement}
			bind:value
			on:keydown={handleKeyDown}
			on:input={handleInput}
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

	.slash-menu {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		background-color: white;
		pointer-events: auto;
	}

	.slash-menu-wrapper {
		pointer-events: auto;
	}

	.slash-menu-options button {
		transition: all 0.15s ease;
	}

	.slash-menu-options button:hover {
		background-color: #f3f4f6;
	}
</style>
