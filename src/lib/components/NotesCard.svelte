<script>
	import { setNotes, setJournal } from '$lib/store.js';
	import RichEditor from './RichEditor.svelte';

	export let date; // YYYY-MM-DD
	export let notes = '';
	export let journal = '';
</script>

<!-- Re-key on date so the editors reset to the selected day's content. -->
{#key date}
	<div class="notes-grid">
		<div class="editor card">
			<label>Notes</label>
			<RichEditor
				html={notes}
				minHeight="100px"
				placeholder="Quick notes, reminders, du‘ā lists…"
				on:change={(e) => setNotes(date, e.detail)}
			/>
		</div>

		<div class="editor card">
			<label>Journal</label>
			<RichEditor
				html={journal}
				minHeight="150px"
				placeholder="How did the day go? Reflections, gratitude, lessons…"
				on:change={(e) => setJournal(date, e.detail)}
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
