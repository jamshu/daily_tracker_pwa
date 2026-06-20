<script>
	import { createEventDispatcher } from 'svelte';
	export let deed; // { id, name, hint }
	export let done = false;
	const dispatch = createEventDispatcher();
</script>

<button class="deed" class:done aria-pressed={done} on:click={() => dispatch('toggle')}>
	<span class="check">
		{#if done}
			<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
				<path d="M20 6 9 17l-5-5" />
			</svg>
		{/if}
	</span>
	<span class="meta">
		<span class="name">{deed.name}</span>
		{#if deed.hint}<span class="hint">{deed.hint}</span>{/if}
	</span>
</button>

<style>
	.deed {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		text-align: left;
		padding: 13px 14px;
		border-bottom: 1px solid var(--border);
		transition: background 0.15s ease;
	}
	.deed:last-child {
		border-bottom: none;
	}
	.deed:active {
		background: var(--surface-2);
	}
	.check {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		border: 2px solid var(--text-faint);
		color: #042f2a;
		transition: all 0.18s ease;
	}
	.deed.done .check {
		background: var(--green);
		border-color: var(--green);
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.name {
		font-weight: 700;
		font-size: 1.02rem;
	}
	.deed.done .name {
		color: var(--green);
	}
	.hint {
		font-size: 0.74rem;
		color: var(--text-faint);
	}
</style>
