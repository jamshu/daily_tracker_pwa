<script>
	import { createEventDispatcher } from 'svelte';
	export let activity; // { id, name, unit, target, step }
	export let value = 0;
	export let target = null; // per-user override; falls back to activity.target
	const dispatch = createEventDispatcher();

	$: tgt = target ?? activity.target;
	$: frac = Math.min(value / tgt, 1);
	$: pct = Math.round(frac * 100);
	$: met = value >= tgt;

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
		on:input={(e) => set(Number(e.currentTarget.value))}
		aria-label={activity.name}
	/>
	<div class="bar">
		<div class="fill" style="width:{pct}%" />
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
		font-weight: 700;
		font-size: 1.02rem;
	}
	.goal {
		font-size: 0.8rem;
		color: var(--text-dim);
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
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.slider::-moz-range-track {
		height: 9px;
		border-radius: 999px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
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
	.bar {
		height: 9px;
		border-radius: 999px;
		background: var(--bg-soft);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--teal-deep), var(--teal));
		transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.activity.met .fill {
		background: linear-gradient(90deg, var(--teal), var(--green));
	}
</style>
