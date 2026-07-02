<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	export let prayer; // { id, name, emoji, hasSunnah, sunnah }

	const reduced =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const dur = reduced ? 0 : 200;
	export let record = { jamath: false, home: false, late: false, missed: false, sunnah: false, dhikr: false };
	const dispatch = createEventDispatcher();

	$: attended = record.jamath || record.home || record.late;
	// "done" = attended + dhikr + sunnah where applicable
	$: done = attended && record.dhikr && (prayer.hasSunnah ? record.sunnah : true);
	// collapsed status label + colour key
	$: status = record.jamath
		? { label: 'Jamāʻah', key: 'jamath' }
		: record.home
			? { label: 'Alone', key: 'home' }
			: record.late
				? { label: 'Late', key: 'late' }
				: record.missed
					? { label: 'Missed', key: 'missed' }
					: { label: '—', key: 'none' };

	let expanded = false;
	const toggle = () => (expanded = !expanded);
</script>

<div class="prayer" class:done class:missed={record.missed}>
	<div
		class="head"
		role="button"
		tabindex="0"
		on:click={toggle}
		on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}
	>
		<span class="name"><span class="emo" aria-hidden="true">{prayer.emoji}</span>{prayer.name}</span>
		<span class="summary">
			<span class="chip {status.key}">{status.label}</span>
			{#if prayer.hasSunnah}<span class="tick" class:on={record.sunnah}>S</span>{/if}
			<span class="tick" class:on={record.dhikr}>D</span>
		</span>
	</div>

	{#if expanded}
	<div class="body" transition:slide={{ duration: dur }}>
		{#if prayer.hasSunnah}
			<span class="hint">Sunnah: {prayer.sunnah}</span>
		{/if}
		<div class="toggles">
			<button class="pill jamath" class:on={record.jamath} aria-pressed={record.jamath}
				on:click={() => dispatch('toggle', { field: 'jamath' })}><span class="dot" />Jamāʻah</button>
			<button class="pill home" class:on={record.home} aria-pressed={record.home}
				on:click={() => dispatch('toggle', { field: 'home' })}><span class="dot" />Alone</button>
			<button class="pill late" class:on={record.late} aria-pressed={record.late}
				on:click={() => dispatch('toggle', { field: 'late' })}><span class="dot" />Late</button>
			<button class="pill missed" class:on={record.missed} aria-pressed={record.missed}
				on:click={() => dispatch('toggle', { field: 'missed' })}><span class="dot" />Missed</button>

			{#if prayer.hasSunnah}
				<button class="pill sunnah" class:on={record.sunnah} aria-pressed={record.sunnah}
					on:click={() => dispatch('toggle', { field: 'sunnah' })}><span class="dot" />Sunnah</button>
			{/if}
			<button class="pill dhikr" class:on={record.dhikr} aria-pressed={record.dhikr}
				on:click={() => dispatch('toggle', { field: 'dhikr' })}><span class="dot" />Dhikr</button>
		</div>
	</div>
	{/if}
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
	.prayer.missed::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: var(--red, #ef4444);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		cursor: pointer;
	}
	.name {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		font-family: var(--font-display);
		font-weight: 600;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		font-size: 1.14rem;
		letter-spacing: -0.01em;
	}
	.name .emo {
		font-size: 1.05rem;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.prayer.done .name {
		color: var(--green);
	}
	.summary {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.chip {
		font-size: 0.74rem;
		font-weight: 700;
		padding: 3px 10px;
		border-radius: 999px;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.chip.jamath { color: var(--on-accent); background: var(--teal); border-color: var(--teal); }
	.chip.home { color: #fff; background: var(--teal-deep); border-color: var(--teal-deep); }
	.chip.late { color: var(--on-amber); background: var(--amber); border-color: var(--amber); }
	.chip.missed { color: var(--on-red); background: var(--red, #ef4444); border-color: var(--red, #ef4444); }
	.tick {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		display: grid;
		place-items: center;
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--text-faint);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.tick.on {
		color: var(--on-green);
		background: var(--green);
		border-color: var(--green);
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
	.pill.jamath.on {
		color: var(--on-accent);
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
	.pill.late.on {
		color: var(--on-amber);
		background: var(--amber);
		border-color: var(--amber);
		box-shadow: 0 3px 14px color-mix(in srgb, var(--amber) 45%, transparent);
	}
	.pill.missed.on {
		color: var(--on-red);
		background: var(--red, #ef4444);
		border-color: var(--red, #ef4444);
		box-shadow: 0 3px 14px color-mix(in srgb, var(--red, #ef4444) 45%, transparent);
	}
	.pill.sunnah.on {
		color: var(--on-gold);
		background: var(--gold);
		border-color: var(--gold);
		box-shadow: 0 3px 14px color-mix(in srgb, var(--gold) 45%, transparent);
	}
	.pill.dhikr.on {
		color: var(--on-green);
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
