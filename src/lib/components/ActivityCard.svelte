<script>
	import { createEventDispatcher } from 'svelte';
	export let activity; // { id, name, unit, target, step }
	export let value = 0;
	export let target = null; // per-user override; falls back to activity.target
	export let missed = false; // intentionally-not-done flag (red state)
	const dispatch = createEventDispatcher();

	$: tgt = target ?? activity.target;
	$: met = value >= tgt;
	$: fill = Math.min(100, tgt ? (value / tgt) * 100 : 0);

	// Cap at target: value can never exceed the goal (slider max, quick-add, done).
	function set(v) {
		dispatch('set', { value: Math.max(0, Math.min(tgt, v)) });
	}
	const add = (n) => set(value + n);
	const complete = () => set(tgt);
	const miss = () => dispatch('missed');
</script>

<div class="activity card" class:met class:missed>
	<div class="head">
		<span class="name">{activity.name}</span>
		<span class="goal" class:met class:missed>
			{#if missed}Missed{:else}{value}/{tgt} {activity.unit}{/if}
		</span>
	</div>

	<input
		class="slider"
		type="range"
		min="0"
		max={tgt}
		step="1"
		value={missed ? 0 : value}
		style="--fill:{missed ? 0 : fill}%"
		on:input={(e) => set(Number(e.currentTarget.value))}
		aria-label={`${activity.name} amount`}
	/>

	<div class="actions">
		<button type="button" class="add" on:click={() => add(1)}>+1</button>
		<button type="button" class="add" on:click={() => add(3)}>+3</button>
		<button type="button" class="add" on:click={() => add(5)}>+5</button>
		<button type="button" class="done" on:click={complete}>Completed</button>
		<button type="button" class="miss" class:on={missed} on:click={miss}>Missed</button>
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
	.goal.met {
		color: var(--green);
		font-weight: 600;
	}
	.goal.missed {
		color: var(--red, #ef4444);
		font-weight: 600;
	}

	/* Slider — track shows progress fill up to the thumb via --fill. */
	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 9px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: linear-gradient(90deg, var(--teal) var(--fill, 0%), var(--bg-soft) var(--fill, 0%));
		cursor: pointer;
		margin: 0;
	}
	.activity.met .slider {
		background: linear-gradient(90deg, var(--green) var(--fill, 0%), var(--bg-soft) var(--fill, 0%));
	}
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--text);
		border: 2px solid var(--surface-2);
		cursor: pointer;
	}
	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border: 2px solid var(--surface-2);
		border-radius: 50%;
		background: var(--text);
		cursor: pointer;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.actions button {
		height: 32px;
		padding: 0 10px;
		border-radius: 8px;
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text);
		background: var(--surface-2);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.actions button:active {
		transform: scale(0.97);
	}
	.actions .add {
		min-width: 40px;
	}
	.actions .add:hover {
		background: var(--teal-deep);
	}
	.actions .done {
		margin-left: auto;
		color: var(--green);
	}
	.actions .done:hover {
		background: var(--teal-deep);
	}
	.actions .miss {
		color: var(--red, #ef4444);
	}
	.actions .miss.on {
		background: var(--red, #ef4444);
		color: #fff;
		border-color: var(--red, #ef4444);
	}
</style>
