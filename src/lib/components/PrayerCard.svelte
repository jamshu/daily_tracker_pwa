<script>
	import { createEventDispatcher } from 'svelte';
	export let prayer; // { id, name, hasSunnah, sunnah }
	export let record = { jamath: false, sunnah: false, dhikr: false };
	const dispatch = createEventDispatcher();

	// "done" = every applicable toggle is on
	$: done = record.jamath && record.dhikr && (prayer.hasSunnah ? record.sunnah : true);
</script>

<div class="prayer" class:done>
	<div class="head">
		<span class="name">{prayer.name}</span>
		{#if prayer.hasSunnah}
			<span class="hint">Sunnah: {prayer.sunnah}</span>
		{/if}
	</div>

	<div class="toggles">
		<button
			class="pill jamath"
			class:on={record.jamath}
			aria-pressed={record.jamath}
			on:click={() => dispatch('toggle', { field: 'jamath' })}
		>
			<span class="dot" />
			Jamāʻah
		</button>

		{#if prayer.hasSunnah}
			<button
				class="pill sunnah"
				class:on={record.sunnah}
				aria-pressed={record.sunnah}
				on:click={() => dispatch('toggle', { field: 'sunnah' })}
			>
				<span class="dot" />
				Sunnah
			</button>
		{/if}

		<button
			class="pill dhikr"
			class:on={record.dhikr}
			aria-pressed={record.dhikr}
			on:click={() => dispatch('toggle', { field: 'dhikr' })}
		>
			<span class="dot" />
			Dhikr
		</button>
	</div>
</div>

<style>
	.prayer {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 13px 14px;
		border-bottom: 1px solid var(--border);
	}
	.prayer:last-child {
		border-bottom: none;
	}
	.head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		flex-wrap: wrap;
	}
	.name {
		font-weight: 700;
		font-size: 1.05rem;
	}
	.prayer.done .name {
		color: var(--green);
	}
	.hint {
		font-size: 0.74rem;
		color: var(--text-faint);
	}
	.toggles {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 8px 13px;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		transition: all 0.18s ease;
	}
	.pill .dot {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		border: 2px solid var(--text-faint);
		transition: all 0.18s ease;
	}
	/* on-states: Jamāʻah = teal, Sunnah = gold, Dhikr = green */
	.pill.jamath.on {
		color: #042f2a;
		background: var(--teal);
		border-color: var(--teal);
	}
	.pill.sunnah.on {
		color: #2a1e05;
		background: var(--gold);
		border-color: var(--gold);
	}
	.pill.dhikr.on {
		color: #04261c;
		background: var(--green);
		border-color: var(--green);
	}
	.pill.on .dot {
		background: currentColor;
		border-color: currentColor;
	}
	.pill:active {
		transform: scale(0.96);
	}
</style>
