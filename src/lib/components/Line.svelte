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

<div class="flex justify-center border-t border-gray-100 pt-6">
	<div class="relative w-3/4 max-w-md rounded-lg bg-gray-50 p-3">
		<textarea
			bind:this={inputElement}
			bind:value
			on:keydown={handleKeyDown}
			on:input={adjustHeight}
			placeholder="Write something..."
			class="max-h-[200px] min-h-[56px] w-full resize-none overflow-y-auto bg-transparent outline-none focus:outline-none"
			rows="1"
		></textarea>
	</div>
</div>

<style>
	textarea {
		border: none;
		font-family: inherit;
		line-height: 1.6;
		font-size: 1rem;
	}
</style>
