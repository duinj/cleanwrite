<script lang="ts">
	import { rewriteText } from '$lib/services/gemini';
	import { isLLMLoading, hasAPIKey, initializeAPIKeyState } from '$lib/stores/gemini';
	import { clearContext, getCurrentTone, setTone } from '$lib/stores/context';
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
	let toneSubmenuVisible = false;
	let currentSelectedTone: string | null = null;
	let selectedToneIndex = 0;
	let toneSubmenuOptions: HTMLElement[] = [];
	let slashInput = '';

	// Available tones for writing
	const availableTones = [
		'professional',
		'casual',
		'friendly',
		'formal',
		'technical',
		'enthusiastic',
		'confident',
		'persuasive',
		'humorous',
		'empathetic'
	];

	// Available slash commands
	const slashCommands = [
		{
			name: 'tone',
			description: `${currentSelectedTone ? `Current: ${currentSelectedTone}` : 'Set writing tone'}`
		},
		{ name: 'rewrite', description: '' },
		{ name: 'clear', description: 'Clear writing history' }
	];

	// Initialize API key state on component mount, but only in browser
	$effect.root(() => {
		if (isBrowser) {
			initializeAPIKeyState();
			// Get the current tone
			currentSelectedTone = getCurrentTone();
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

			// Remove the slash character if triggered from slash command
			let textToRewrite = value;
			if (textToRewrite.includes('/')) {
				// Find the slash that's either at the beginning or after a space
				const slashIndex = textToRewrite
					.split('')
					.findIndex(
						(char: string, i: number) => char === '/' && (i === 0 || textToRewrite[i - 1] === ' ')
					);

				if (slashIndex >= 0) {
					// Remove the slash character
					textToRewrite =
						textToRewrite.substring(0, slashIndex) + textToRewrite.substring(slashIndex + 1);
				}
			}

			const rewrittenText = await rewriteText(textToRewrite);

			// Ensure the rewritten text doesn't have quotes around it
			value = rewrittenText.replace(/^["'](.*)["']$/, '$1');

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

		// Get cursor position
		const cursorPos = inputElement ? inputElement.selectionStart || 0 : 0;

		// Check if the character at the cursor position is a slash
		// This works regardless of where in the text the slash is typed
		if (
			value &&
			value[cursorPos - 1] === '/' &&
			(cursorPos === 1 || value[cursorPos - 2] === ' ')
		) {
			console.log('Slash detected in input, showing menu');
			slashInput = ''; // Reset slash input when first showing menu
			createDirectSlashMenu(cursorPos - 1);
			selectedMenuIndex = 0;
		} else if (slashMenuElement && value) {
			// Update the menu based on what is typed after the slash
			const slashPos = value.lastIndexOf('/');
			if (slashPos !== -1 && cursorPos > slashPos) {
				// Extract what was typed after the slash
				slashInput = value.substring(slashPos + 1, cursorPos).toLowerCase();
				// Rebuild the menu with filtered commands
				updateSlashMenuCommands();
			} else {
				// If cursor is before the slash, close the menu
				removeDirectSlashMenu();
			}
		} else {
			removeDirectSlashMenu();
		}
	}

	// Update slash menu based on what has been typed
	function updateSlashMenuCommands() {
		if (!slashMenuElement) return;

		// Remove all existing options
		while (slashMenuElement.children.length > 1) {
			// Keep the header
			slashMenuElement.removeChild(slashMenuElement.lastChild as Node);
		}
		slashMenuOptions = [];

		// Filter commands based on input
		const filteredCommands = slashCommands.filter((cmd) =>
			cmd.name.toLowerCase().startsWith(slashInput)
		);

		// If no matches, remove menu
		if (filteredCommands.length === 0) {
			removeDirectSlashMenu();
			return;
		}

		// Reset selected index if needed
		if (selectedMenuIndex >= filteredCommands.length) {
			selectedMenuIndex = 0;
		}

		// Add filtered commands to menu
		filteredCommands.forEach((cmd, index) => {
			let onClick;
			if (cmd.name === 'tone') {
				onClick = () => showToneSubmenu(slashMenuElement!);
			} else if (cmd.name === 'rewrite') {
				onClick = () => {
					removeDirectSlashMenu();
					handleLLMRewrite();
				};
			} else if (cmd.name === 'clear') {
				onClick = () => {
					removeDirectSlashMenu();
					clearContext();
				};
			}

			const option = createMenuOption(cmd.name, cmd.description, onClick!, index);
			slashMenuElement!.appendChild(option);
			slashMenuOptions.push(option);
		});

		// Update visual selection
		updateSelectedMenuItem();
	}

	// DOM-based direct slash menu implementation
	function createDirectSlashMenu(slashPosition = 0) {
		// Remove any existing menu first
		removeDirectSlashMenu();

		// Get cursor position for menu placement
		if (inputElement) {
			// Get position of the input element
			const rect = inputElement.getBoundingClientRect();

			// Create a range to get exact cursor position
			let menuX = rect.left + 30; // Default position

			// If we're in the middle of text, calculate better X position
			if (slashPosition > 0) {
				// Create a hidden span to measure text width up to the slash position
				const tempSpan = document.createElement('span');
				tempSpan.style.visibility = 'hidden';
				tempSpan.style.position = 'absolute';
				tempSpan.style.fontSize = '0.95rem'; // Match textarea font size
				tempSpan.style.fontFamily = 'inherit';
				tempSpan.style.whiteSpace = 'pre';

				// Get text before the slash
				const textBeforeSlash = value.substring(0, slashPosition);
				tempSpan.textContent = textBeforeSlash;

				// Add to DOM, measure, then remove
				document.body.appendChild(tempSpan);
				const textWidth = tempSpan.getBoundingClientRect().width;
				document.body.removeChild(tempSpan);

				// Position menu at the slash, accounting for padding
				menuX = rect.left + textWidth + 12;
			}

			// Create a new menu
			const menu = document.createElement('div');
			menu.id = 'direct-slash-menu';
			menu.style.position = 'fixed';
			menu.style.top = `${rect.bottom + 10}px`; // Position below the input line
			menu.style.left = `${menuX}px`; // Position at slash position
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

			// Initialize with all commands
			updateSlashMenuCommands();

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
		toneSubmenuVisible = false;
		toneSubmenuOptions = [];
	}

	// Handle key press for slash and escape to close
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();

			// If tone submenu is open, select the current tone
			if (toneSubmenuVisible && slashMenuElement) {
				selectCurrentToneItem();
				return;
			}

			// If slash menu is open, handle the selection
			if (slashMenuElement) {
				// If there's a filtered result
				if (slashMenuOptions.length > 0) {
					// Get the command name from the selected option
					const selectedCommand = slashMenuOptions[selectedMenuIndex]
						.querySelector('span')
						?.textContent?.toLowerCase();

					// Handle each command
					if (selectedCommand === 'tone') {
						showToneSubmenu(slashMenuElement);
						return;
					} else if (selectedCommand === 'rewrite') {
						removeDirectSlashMenu();
						handleLLMRewrite();
						return;
					} else if (selectedCommand === 'clear') {
						removeDirectSlashMenu();
						clearContext();
						return;
					}
				}

				// If no match, just remove the menu
				removeDirectSlashMenu();
				return;
			}

			// Check if the input starts with specific commands
			const input = value.trim();
			// Process tone command
			if (input.startsWith('/t ') || input === '/t') {
				const tonePart = input.substring(3).trim();
				if (tonePart) {
					// If there's text after /t, use it as tone
					handleToneCommand(tonePart);
				} else {
					// Just /t, show the tone menu
					createDirectSlashMenu();
					if (slashMenuElement) {
						showToneSubmenu(slashMenuElement);
					}
				}
				return;
			}
			// Process rewrite command
			else if (input.startsWith('/r') && (input === '/r' || input.startsWith('/r '))) {
				handleLLMRewrite();
				value = ''; // Clear input
				return;
			}
			// Process clear command
			else if (input.startsWith('/c') && (input === '/c' || input.startsWith('/c '))) {
				clearContext();
				value = ''; // Clear input
				return;
			}
			// Legacy tone command handling
			else if (input.startsWith('/tone ')) {
				const toneName = input.substring(6).trim();
				handleToneCommand(toneName);
				return;
			}

			const submittedText = value;
			onSubmit(submittedText);
			value = ''; // Clear the input immediately
			removeDirectSlashMenu();
		} else if (event.key === 'ArrowUp') {
			// If tone submenu is open, navigate up in the submenu
			if (toneSubmenuVisible) {
				event.preventDefault();
				selectedToneIndex = Math.max(0, selectedToneIndex - 1);
				updateSelectedToneItem();
				// Scroll to keep the selected item in view
				if (toneSubmenuOptions[selectedToneIndex]) {
					toneSubmenuOptions[selectedToneIndex].scrollIntoView({
						behavior: 'smooth',
						block: 'nearest'
					});
				}
				return;
			}

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
			// If tone submenu is open, navigate down in the submenu
			if (toneSubmenuVisible) {
				event.preventDefault();
				selectedToneIndex = Math.min(availableTones.length - 1, selectedToneIndex + 1);
				updateSelectedToneItem();
				// Scroll to keep the selected item in view
				if (toneSubmenuOptions[selectedToneIndex]) {
					toneSubmenuOptions[selectedToneIndex].scrollIntoView({
						behavior: 'smooth',
						block: 'nearest'
					});
				}
				return;
			}

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
			// If tone submenu is open, close just the submenu but keep the main menu open
			if (toneSubmenuVisible) {
				const submenu = document.getElementById('tone-submenu');
				if (submenu) {
					submenu.remove();
				}
				toneSubmenuVisible = false;
				return;
			}

			// Otherwise, remove the entire menu
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
			// Show menu whenever slash is typed (not just at beginning)
			// Allow the slash character to be added to the input
			setTimeout(() => {
				if (inputElement) {
					const cursorPos = inputElement.selectionStart || 0;
					// Only show if slash is after a space or at beginning
					if (cursorPos === 1 || (value && value[cursorPos - 2] === ' ')) {
						console.log('Slash key pressed, showing menu');
						createDirectSlashMenu(cursorPos - 1);
					}
				}
			}, 10);
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

	function showToneSubmenu(parentMenu: HTMLElement): void {
		// Clear any existing submenu
		const existingSubmenu = document.getElementById('tone-submenu');
		if (existingSubmenu) {
			existingSubmenu.remove();
		}

		// Create submenu container
		const submenu = document.createElement('div');
		submenu.id = 'tone-submenu';
		submenu.style.backgroundColor = 'white';
		submenu.style.padding = '12px';
		submenu.style.marginTop = '8px';
		submenu.style.borderTop = '1px solid #e5e7eb';
		submenu.style.maxHeight = '300px';
		submenu.style.overflowY = 'auto';

		// Header
		const header = document.createElement('div');
		header.textContent = 'Select Writing Tone';
		header.style.fontSize = '14px';
		header.style.fontWeight = 'bold';
		header.style.marginBottom = '10px';
		header.style.color = '#4b5563';
		submenu.appendChild(header);

		// Reset tone options array
		toneSubmenuOptions = [];
		selectedToneIndex = 0;

		// Create list of tone options (instead of grid for better keyboard navigation)
		const toneList = document.createElement('div');
		toneList.style.display = 'flex';
		toneList.style.flexDirection = 'column';
		toneList.style.gap = '4px';

		// Add all available tones
		availableTones.forEach((tone, index) => {
			const toneButton = document.createElement('div');
			toneButton.textContent = tone;
			toneButton.style.padding = '8px 12px';
			toneButton.style.border = '1px solid #e5e7eb';
			toneButton.style.borderRadius = '4px';
			toneButton.style.background = 'white';
			toneButton.style.fontSize = '13px';
			toneButton.style.cursor = 'pointer';
			toneButton.style.textTransform = 'capitalize';

			// Set data attribute for identification
			toneButton.setAttribute('data-tone-index', index.toString());

			// Set the first option as selected by default, or the current tone if set
			if (
				(currentSelectedTone && tone === currentSelectedTone) ||
				(!currentSelectedTone && index === 0)
			) {
				selectedToneIndex = index;
			}

			// Add hover effect
			toneButton.addEventListener('mouseover', () => {
				selectedToneIndex = index;
				updateSelectedToneItem();
			});

			// Handle click to select the tone
			toneButton.addEventListener('click', () => {
				selectTone(tone);
			});

			toneList.appendChild(toneButton);
			toneSubmenuOptions.push(toneButton);
		});

		submenu.appendChild(toneList);
		parentMenu.appendChild(submenu);

		// Update the state
		toneSubmenuVisible = true;

		// Set the initial selection
		updateSelectedToneItem();
	}

	function updateSelectedToneItem() {
		if (toneSubmenuOptions) {
			toneSubmenuOptions.forEach((option, index) => {
				if (index === selectedToneIndex) {
					option.style.backgroundColor = '#eff6ff';
					option.style.borderColor = '#60a5fa';
					option.style.fontWeight = 'bold';
				} else {
					option.style.backgroundColor = 'white';
					option.style.borderColor = '#e5e7eb';
					option.style.fontWeight = 'normal';
				}
			});
		}
	}

	function selectTone(tone: string) {
		setTone(tone);
		currentSelectedTone = tone;
		removeDirectSlashMenu(); // This closes both the main menu and submenu

		// Update the text in the input to reflect the selected tone
		if (value.includes('/tone') && inputElement) {
			value = value.replace(/\/tone.*/, '').trim();
		}
	}

	function selectCurrentToneItem() {
		if (toneSubmenuVisible && toneSubmenuOptions && toneSubmenuOptions[selectedToneIndex]) {
			const selectedTone = availableTones[selectedToneIndex];
			selectTone(selectedTone);
		}
	}

	function handleToneCommand(toneName: string) {
		if (availableTones.includes(toneName.toLowerCase())) {
			setTone(toneName.toLowerCase());
			currentSelectedTone = toneName.toLowerCase();
			value = ''; // Clear input after setting tone
		} else {
			// Show error that tone is not recognized
			errorMessage = `Tone "${toneName}" not recognized. Try one of: ${availableTones.join(', ')}`;
			// Clear error after 3 seconds
			setTimeout(() => {
				errorMessage = '';
			}, 3000);
		}
	}

	function handleSlashCommand(command: string) {
		showSlashMenu = false;
		if (command === 'rewrite') {
			handleLLMRewrite();
		} else if (command === 'tone') {
			// Show tone selection UI
			createDirectSlashMenu();
			if (slashMenuElement) {
				showToneSubmenu(slashMenuElement);
			}
		} else if (command === 'clear') {
			clearContext();
		}
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
