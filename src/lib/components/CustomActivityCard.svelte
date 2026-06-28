<script>
	import { createEventDispatcher } from 'svelte';
	export let activity; // { id, name, unit, step, target }
	export let value = 0;
	const dispatch = createEventDispatcher();

	$: tgt = activity.target ?? 1;
	$: met = value >= tgt;
	$: fill = Math.min(100, tgt ? (value / tgt) * 100 : 0);

	function set(v) { dispatch('set', { value: Math.max(0, v) }); }

	// Manual entry: edit a local draft, only mirror the incoming value when not
	// focused, commit on blur/Enter.
	let editing = false;
	let draft = String(value);
	$: if (!editing) draft = String(value);

	function commit() {
		editing = false;
		const n = Math.max(0, Math.round(Number(draft)));
		if (Number.isFinite(n)) set(n);
		else draft = String(value);
	}
</script>

<div class="activity card" class:met>
	<div class="head">
		<span class="name">{activity.name}</span>
		<span class="goal" class:met>{tgt} {activity.unit}</span>
	</div>
	<div class="controls">
		<div class="bar" style="--fill:{fill}%"><span class="fill"></span></div>
		<div class="stepper">
			<button
				type="button"
				on:click={() => set(value - activity.step)}
				disabled={value <= 0}
				aria-label={`decrease ${activity.name}`}>−</button>
			<input
				class="num"
				class:met
				type="text"
				inputmode="numeric"
				bind:value={draft}
				on:focus={() => (editing = true)}
				on:blur={commit}
				on:keydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
				aria-label={`${activity.name} amount`}
			/>
			<button
				type="button"
				on:click={() => set(value + activity.step)}
				aria-label={`increase ${activity.name}`}>+</button>
		</div>
	</div>
</div>

<style>
	.activity {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.name {
		font-family: var(--font-display);
		font-weight: 600;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		font-size: 1.12rem;
		letter-spacing: -0.01em;
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.goal {
		font-family: var(--font-display);
		font-size: 0.92rem;
		font-weight: 500;
		color: var(--text-dim);
		font-variant-numeric: tabular-nums;
		flex: 0 0 auto;
		white-space: nowrap;
	}
	.goal.met { color: var(--green); font-weight: 600; }
	.controls {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.bar {
		flex: 1;
		height: 9px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--bg-soft);
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		width: var(--fill, 0%);
		border-radius: 999px;
		background: linear-gradient(90deg, var(--teal-deep), var(--teal));
		transition: width 0.25s ease;
	}
	.activity.met .fill { background: var(--green); }
	.stepper {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 0 0 auto;
	}
	.num {
		width: 46px;
		flex: 0 0 auto;
		height: 30px;
		padding: 0 4px;
		text-align: center;
		font-family: var(--font-display);
		/* 16px min — smaller makes iOS Safari auto-zoom on focus and stay zoomed. */
		font-size: 16px;
		font-weight: 600;
		color: var(--text);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-variant-numeric: tabular-nums;
		-webkit-appearance: none;
		appearance: none;
	}
	.num::-webkit-outer-spin-button,
	.num::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.num:focus {
		outline: none;
		border-color: var(--teal);
	}
	.num.met {
		color: var(--green);
	}
	.stepper button {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text);
		background: var(--surface-2);
		border: 1px solid var(--border);
		display: grid;
		place-items: center;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.stepper button:hover:not(:disabled) { background: var(--teal-deep); }
	.stepper button:active:not(:disabled) { transform: scale(0.97); }
	.stepper button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
