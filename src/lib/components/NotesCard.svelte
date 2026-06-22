<script>
	import { setNotes } from '$lib/store.js';
	import RichEditor from './RichEditor.svelte';

	export let date; // YYYY-MM-DD
	export let notes = '';
</script>

<!-- Re-key on date so the editor resets to the selected day's content. -->
{#key date}
	<div class="notes-grid">
		<div class="editor card">
			<label>Notes</label>
			<RichEditor
				html={notes}
				minHeight="150px"
				placeholder="Quick notes, reflections, du‘ā lists…"
				on:change={(e) => setNotes(date, e.detail)}
			/>
		</div>
	</div>
{/key}

<style>
	.notes-grid {
		display: grid;
		gap: 10px;
	}
	.editor {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-dim);
	}
</style>
