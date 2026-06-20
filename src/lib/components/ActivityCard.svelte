<script>
	import { createEventDispatcher } from 'svelte';
	export let activity; // { id, name, unit, target, step }
	export let value = 0;
	const dispatch = createEventDispatcher();

	$: frac = Math.min(value / activity.target, 1);
	$: pct = Math.round(frac * 100);
	$: met = value >= activity.target;

	function set(v) {
		dispatch('set', { value: Math.max(0, v) });
	}
</script>

<div class="activity card" class:met>
	<div class="top">
		<div class="head">
			<span class="name">{activity.name}</span>
			<span class="goal" class:met>{value} / {activity.target} {activity.unit}</span>
		</div>
		<div class="stepper">
			<button on:click={() => set(value - activity.step)} aria-label="decrease">−</button>
			<span class="val">{value}</span>
			<button on:click={() => set(value + activity.step)} aria-label="increase">+</button>
		</div>
	</div>
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
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 3px;
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
	.stepper {
		display: flex;
		align-items: center;
		gap: 4px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 4px;
	}
	.stepper button {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--text);
		background: var(--surface-2);
		display: grid;
		place-items: center;
		line-height: 1;
		transition: all 0.15s ease;
	}
	.stepper button:hover {
		background: var(--teal-deep);
	}
	.stepper button:active {
		transform: scale(0.9);
	}
	.val {
		min-width: 30px;
		text-align: center;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
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
