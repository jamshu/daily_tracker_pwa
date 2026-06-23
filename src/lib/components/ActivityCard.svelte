<script>
	import { createEventDispatcher } from 'svelte';
	export let activity; // { id, name, unit, target, step }
	export let value = 0;
	export let target = null; // per-user override; falls back to activity.target
	const dispatch = createEventDispatcher();

	$: tgt = target ?? activity.target;
	$: met = value >= tgt;
	$: fill = Math.min(100, tgt ? (value / tgt) * 100 : 0);

	function set(v) {
		dispatch('set', { value: Math.max(0, v) });
	}
</script>

<div class="activity card" class:met>
	<div class="head">
		<span class="name">{activity.name}</span>
		<span class="goal" class:met>{value} / {tgt} {activity.unit}</span>
	</div>
	<input
		class="slider"
		type="range"
		min="0"
		max={tgt}
		step={activity.step}
		{value}
		style="--fill:{fill}%"
		on:input={(e) => set(Number(e.currentTarget.value))}
		aria-label={activity.name}
	/>
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
	}
	.goal {
		font-family: var(--font-display);
		font-size: 0.92rem;
		font-weight: 500;
		color: var(--text-dim);
		font-variant-numeric: tabular-nums;
	}
	.goal.met {
		color: var(--green);
		font-weight: 600;
	}
	.slider {
		width: 100%;
		height: 28px;
		background: transparent;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
	}
	.slider::-webkit-slider-runnable-track {
		height: 9px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: linear-gradient(
			90deg,
			var(--teal-deep) 0,
			var(--teal) var(--fill, 0%),
			var(--bg-soft) var(--fill, 0%)
		);
	}
	.slider::-moz-range-track {
		height: 9px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: linear-gradient(
			90deg,
			var(--teal-deep) 0,
			var(--teal) var(--fill, 0%),
			var(--bg-soft) var(--fill, 0%)
		);
	}
	.activity.met .slider::-webkit-slider-runnable-track {
		background: linear-gradient(90deg, var(--green) 0, var(--green) 100%, var(--bg-soft) 100%);
	}
	.activity.met .slider::-moz-range-track {
		background: linear-gradient(90deg, var(--green) 0, var(--green) 100%, var(--bg-soft) 100%);
	}
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 28px;
		height: 28px;
		margin-top: -10px;
		border-radius: 50%;
		background: var(--teal);
		border: 3px solid var(--surface-2);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
		transition: transform 0.15s ease;
	}
	.slider::-moz-range-thumb {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--teal);
		border: 3px solid var(--surface-2);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
		transition: transform 0.15s ease;
	}
	.slider:active::-webkit-slider-thumb {
		transform: scale(1.12);
		background: var(--teal-deep);
	}
	.slider:active::-moz-range-thumb {
		transform: scale(1.12);
		background: var(--teal-deep);
	}
	.activity.met .slider::-webkit-slider-thumb {
		background: var(--green);
	}
	.activity.met .slider::-moz-range-thumb {
		background: var(--green);
	}
</style>
