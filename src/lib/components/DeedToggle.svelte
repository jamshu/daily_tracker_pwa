<script>
	import { createEventDispatcher } from 'svelte';
	export let deed; // { id, name, hint, guide? }
	export let done = false;
	const dispatch = createEventDispatcher();
</script>

<div class="deed" class:done>
	<button class="main" aria-pressed={done} on:click={() => dispatch('toggle')}>
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

	{#if deed.guide}
		<button class="info" on:click={() => dispatch('info')} aria-label="View {deed.name}" title="View {deed.name}">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
				<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
			</svg>
		</button>
	{/if}
</div>

<style>
	.deed {
		display: flex;
		align-items: stretch;
		gap: 6px;
		padding: 7px 8px 7px 14px;
		border-bottom: 1px solid var(--border);
	}
	.deed:last-child {
		border-bottom: none;
	}
	.main {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		text-align: left;
		padding: 6px 0;
		min-width: 0;
		transition: opacity 0.15s ease;
	}
	.main:active {
		opacity: 0.7;
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
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.1rem;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		letter-spacing: -0.01em;
	}
	.deed.done .name {
		color: var(--green);
	}
	.hint {
		font-size: 0.74rem;
		color: var(--text-faint);
	}
	.info {
		flex-shrink: 0;
		align-self: center;
		width: 38px;
		height: 38px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		color: var(--teal);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	.info:hover {
		background: var(--surface-2);
		color: var(--text);
	}
	.info:active {
		transform: scale(0.94);
	}
</style>
