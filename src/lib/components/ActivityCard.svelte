<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	export let activity; // { id, name, emoji, unit, target, step }

	const reduced =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const dur = reduced ? 0 : 200;
	export let value = 0;
	export let target = null; // per-user override; falls back to activity.target
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

	// Tap the card to reveal the quick-add + Completed buttons (keeps the list tidy).
	let expanded = false;
	const toggle = () => (expanded = !expanded);
</script>

<div class="activity card" class:met>
	<div
		class="head"
		role="button"
		tabindex="0"
		on:click={toggle}
		on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}
	>
		<span class="name">{#if activity.emoji}<span class="emo" aria-hidden="true">{activity.emoji}</span>{/if}{activity.name}</span>
		<span class="goal" class:met>{value}/{tgt} {activity.unit}</span>
	</div>

	<input
		class="slider"
		type="range"
		min="0"
		max={tgt}
		step="1"
		{value}
		style="--fill:{fill}%"
		on:input={(e) => set(Number(e.currentTarget.value))}
		aria-label={`${activity.name} amount`}
	/>

	{#if expanded}
		<div class="actions" transition:slide={{ duration: dur }}>
			<button type="button" class="add" on:click={() => add(1)}>+1</button>
			<button type="button" class="add" on:click={() => add(3)}>+3</button>
			<button type="button" class="add" on:click={() => add(5)}>+5</button>
			<button type="button" class="done" on:click={complete}>Completed</button>
		</div>
	{/if}
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
		cursor: pointer;
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
	.name .emo {
		font-size: 1.02rem;
		margin-right: 9px;
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
	@media (hover: hover) {
		.actions .add:hover {
			background: var(--teal-deep);
		}
	}
	.actions .done {
		margin-left: auto;
		color: var(--green);
	}
	@media (hover: hover) {
		.actions .done:hover {
			background: var(--teal-deep);
		}
	}
</style>
