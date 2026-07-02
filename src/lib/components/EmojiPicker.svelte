<script>
	// Curated emoji grid for picking an activity icon. Tap to select, tap the
	// selected one again to clear. Dispatches `select` with the emoji or ''.
	import { createEventDispatcher } from 'svelte';
	import { CURATED_EMOJI } from '$lib/emoji.js';

	export let value = '';
	const dispatch = createEventDispatcher();

	const pick = (e) => dispatch('select', e === value ? '' : e);
</script>

<div class="picker">
	{#each CURATED_EMOJI as group}
		<div class="cat">{group.label}</div>
		<div class="grid">
			{#each group.emoji as e}
				<button
					type="button"
					class="cell emo"
					class:active={e === value}
					aria-pressed={e === value}
					aria-label={`Icon ${e}`}
					on:click={() => pick(e)}>{e}</button
				>
			{/each}
		</div>
	{/each}
</div>

<style>
	.picker {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-soft);
		padding: 10px 12px 12px;
	}
	.cat {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-faint);
		margin: 10px 2px 6px;
	}
	.cat:first-child {
		margin-top: 0;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
		gap: 6px;
	}
	.cell {
		height: 44px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		font-size: 1.3rem;
		background: var(--surface);
		border: 1px solid var(--border);
		transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
	}
	.cell:active {
		transform: scale(0.92);
	}
	.cell.active {
		background: color-mix(in srgb, var(--teal) 22%, var(--surface));
		border-color: var(--teal);
		box-shadow: 0 0 0 1px var(--teal);
	}
	@media (hover: hover) {
		.cell:hover {
			border-color: color-mix(in srgb, var(--teal) 55%, var(--border));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cell,
		.cell:active {
			transition: none;
			transform: none;
		}
	}
</style>
