<script lang="ts">
	let { value, onSubmit, onKeyNavigation } = $props<{
		value: string;
		onSubmit: (text: string) => void;
		onKeyNavigation: (direction: 'up' | 'down') => void;
	}>();

	let inputElement: HTMLTextAreaElement;

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

	// Focus the input on mount
	$effect.root(() => {
		if (inputElement) {
			inputElement.focus();
		}
	});
</script>

<div
	class="writing-bar shadow-floating flex w-full max-w-3xl items-center rounded-full bg-white px-8 py-0.5"
>
	<textarea
		bind:this={inputElement}
		bind:value
		on:keydown={handleKeyDown}
		on:input={adjustHeight}
		placeholder="Write something..."
		class="max-h-[120px] min-h-[38px] w-full resize-none overflow-y-auto bg-transparent outline-none focus:outline-none"
		rows="1"
	></textarea>
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

	textarea {
		border: none;
		font-family: inherit;
		line-height: 1.5;
		font-size: 0.95rem;
		padding: 9px 0;
	}
</style>
