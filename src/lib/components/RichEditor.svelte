<script>
	import { createEventDispatcher, onMount } from 'svelte';

	export let html = '';
	export let placeholder = '';
	export let minHeight = '120px';

	const dispatch = createEventDispatcher();

	let el; // the contenteditable element
	let focused = false;
	let active = {}; // which inline formats are active at the caret

	// Push external content into the editor when it isn't being edited, so a
	// date switch or async load updates the view without disturbing the caret.
	$: if (el && !focused && (html || '') !== el.innerHTML) {
		el.innerHTML = html || '';
	}

	onMount(() => {
		el.innerHTML = html || '';
	});

	function emit() {
		// normalise a fully-empty editor to '' so the placeholder shows
		const out = el.innerHTML === '<br>' || el.innerHTML === '<div><br></div>' ? '' : el.innerHTML;
		dispatch('change', out);
	}

	function run(cmd, value = null) {
		el.focus();
		document.execCommand(cmd, false, value);
		refresh();
		emit();
	}

	// formatBlock toggles a heading: apply if not set, revert to <p> if already.
	function block(tag) {
		el.focus();
		const current = document.queryCommandValue('formatBlock')?.toLowerCase();
		document.execCommand('formatBlock', false, current === tag ? 'p' : `<${tag}>`);
		refresh();
		emit();
	}

	function refresh() {
		try {
			active = {
				bold: document.queryCommandState('bold'),
				italic: document.queryCommandState('italic'),
				ul: document.queryCommandState('insertUnorderedList'),
				ol: document.queryCommandState('insertOrderedList'),
				h2: document.queryCommandValue('formatBlock')?.toLowerCase() === 'h2',
				h3: document.queryCommandValue('formatBlock')?.toLowerCase() === 'h3'
			};
		} catch {
			active = {};
		}
	}
</script>

<div class="rich" class:focused>
	<div class="toolbar" role="toolbar" aria-label="formatting">
		<button type="button" class:on={active.bold} title="Bold" on:mousedown|preventDefault={() => run('bold')}><b>B</b></button>
		<button type="button" class:on={active.italic} title="Italic" on:mousedown|preventDefault={() => run('italic')}><i>I</i></button>
		<span class="sep" />
		<button type="button" class:on={active.h2} title="Heading" on:mousedown|preventDefault={() => block('h2')}>H1</button>
		<button type="button" class:on={active.h3} title="Subheading" on:mousedown|preventDefault={() => block('h3')}>H2</button>
		<span class="sep" />
		<button type="button" class:on={active.ul} title="Bulleted list" on:mousedown|preventDefault={() => run('insertUnorderedList')} aria-label="bulleted list">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none"/><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/></svg>
		</button>
		<button type="button" class:on={active.ol} title="Numbered list" on:mousedown|preventDefault={() => run('insertOrderedList')} aria-label="numbered list">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><text x="1.5" y="8" font-size="7" fill="currentColor" stroke="none">1</text><text x="1.5" y="15" font-size="7" fill="currentColor" stroke="none">2</text><text x="1.5" y="22" font-size="7" fill="currentColor" stroke="none">3</text><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/></svg>
		</button>
		<span class="sep" />
		<button type="button" title="Clear formatting" on:mousedown|preventDefault={() => run('removeFormat')} aria-label="clear formatting">⌫</button>
	</div>

	<div
		class="surface"
		style="min-height:{minHeight}"
		bind:this={el}
		contenteditable="true"
		role="textbox"
		tabindex="0"
		aria-multiline="true"
		data-placeholder={placeholder}
		on:input={emit}
		on:keyup={refresh}
		on:mouseup={refresh}
		on:focus={() => (focused = true)}
		on:blur={() => {
			focused = false;
			emit();
		}}
	/>
</div>

<style>
	.rich {
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-soft);
		overflow: hidden;
		transition: border-color 0.15s ease;
	}
	.rich.focused {
		border-color: var(--teal);
	}
	.toolbar {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 6px;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		flex-wrap: wrap;
	}
	.toolbar button {
		min-width: 30px;
		height: 30px;
		padding: 0 7px;
		border-radius: 7px;
		display: grid;
		place-items: center;
		font-size: 0.85rem;
		color: var(--text-dim);
		transition: all 0.12s ease;
	}
	.toolbar button:hover {
		background: var(--surface-2);
		color: var(--text);
	}
	.toolbar button.on {
		background: var(--teal);
		color: #042f2a;
	}
	.sep {
		width: 1px;
		height: 18px;
		background: var(--border);
		margin: 0 4px;
	}
	.surface {
		padding: 12px;
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--text);
		outline: none;
		overflow-wrap: anywhere;
	}
	.surface:empty::before {
		content: attr(data-placeholder);
		color: var(--text-faint);
		pointer-events: none;
	}
	/* tidy the rendered rich content */
	.surface :global(h2) {
		font-size: 1.15rem;
		margin: 0.4em 0 0.2em;
	}
	.surface :global(h3) {
		font-size: 1.02rem;
		margin: 0.4em 0 0.2em;
	}
	.surface :global(ul),
	.surface :global(ol) {
		margin: 0.3em 0;
		padding-left: 1.4em;
	}
	.surface :global(p) {
		margin: 0.35em 0;
	}
	.surface :global(a) {
		color: var(--teal);
	}
</style>
