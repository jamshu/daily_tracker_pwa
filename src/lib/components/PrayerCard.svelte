<script>
	import { createEventDispatcher } from 'svelte';
	export let prayer; // { id, name, hasSunnah, sunnah }
	export let record = { jamath: false, home: false, sunnah: false, dhikr: false };
	const dispatch = createEventDispatcher();

	// "done" = attended (Jamāʻah or Home) + dhikr + sunnah where applicable
	$: done =
		(record.jamath || record.home) && record.dhikr && (prayer.hasSunnah ? record.sunnah : true);
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

		<button
			class="pill home"
			class:on={record.home}
			aria-pressed={record.home}
			on:click={() => dispatch('toggle', { field: 'home' })}
		>
			<span class="dot" />
			Alone
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
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 13px 14px 13px 16px;
		border-bottom: 1px solid var(--border);
		transition: background 0.25s ease;
	}
	.prayer:last-child {
		border-bottom: none;
	}
	/* completed prayers get a soft green tint + left accent bar */
	.prayer.done {
		background: color-mix(in srgb, var(--green) 7%, transparent);
	}
	.prayer.done::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: var(--green);
	}
	.head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		flex-wrap: wrap;
	}
	.name {
		font-family: var(--font-display);
		font-weight: 600;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		font-size: 1.14rem;
		letter-spacing: -0.01em;
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
	/* on-states: Jamāʻah = teal, Home = soft teal-deep, Sunnah = gold, Dhikr = green */
	.pill.jamath.on {
		color: #042f2a;
		background: var(--teal);
		border-color: var(--teal);
		box-shadow: 0 3px 14px color-mix(in srgb, var(--teal) 45%, transparent);
	}
	.pill.home.on {
		color: #fff;
		background: var(--teal-deep);
		border-color: var(--teal-deep);
		box-shadow: 0 3px 14px color-mix(in srgb, var(--teal-deep) 45%, transparent);
	}
	.pill.sunnah.on {
		color: #2a1e05;
		background: var(--gold);
		border-color: var(--gold);
		box-shadow: 0 3px 14px color-mix(in srgb, var(--gold) 45%, transparent);
	}
	.pill.dhikr.on {
		color: #04261c;
		background: var(--green);
		border-color: var(--green);
		box-shadow: 0 3px 14px color-mix(in srgb, var(--green) 45%, transparent);
	}
	.pill.on .dot {
		background: currentColor;
		border-color: currentColor;
	}
	.pill:active {
		transform: scale(0.96);
	}
</style>
