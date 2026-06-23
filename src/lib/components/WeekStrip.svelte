<script>
	import { createEventDispatcher } from 'svelte';
	import { allDays, shiftKey, dateKey } from '../store.js';
	import { dayProgress } from '../config.js';
	import { settings } from '../settings.js';
	export let todayK;
	export let selectedK;
	const dispatch = createEventDispatcher();

	const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

	// last 7 days ending today (oldest first)
	$: days = Array.from({ length: 7 }, (_, i) => shiftKey(todayK, -(6 - i)));

	function dow(key) {
		const [y, m, d] = key.split('-').map(Number);
		return DOW[new Date(y, m - 1, d).getDay()];
	}
	function dayNum(key) {
		return Number(key.split('-')[2]);
	}
</script>

<div class="strip card">
	{#each days as key (key)}
		{@const prog = dayProgress($allDays[key], $settings.activities, $settings.sex)}
		<button
			class="day"
			class:sel={key === selectedK}
			class:today={key === todayK}
			on:click={() => dispatch('pick', { key })}
		>
			<span class="dow">{dow(key)}</span>
			<span class="ball" style="--p:{prog}">
				<span class="num">{dayNum(key)}</span>
			</span>
		</button>
	{/each}
</div>

<style>
	.strip {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
		padding: 12px 8px;
	}
	.day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 7px;
		padding: 6px 0;
		border-radius: 12px;
		transition: background 0.15s ease;
	}
	.day.sel {
		background: var(--surface-2);
	}
	.dow {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--text-faint);
	}
	.ball {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		/* conic ring shows that day's completion */
		background:
			radial-gradient(circle at center, var(--surface) 56%, transparent 57%),
			conic-gradient(var(--teal) calc(var(--p) * 360deg), var(--border) 0);
		position: relative;
	}
	.day.today .ball {
		box-shadow: 0 0 0 2px var(--gold);
	}
	.num {
		font-size: 0.82rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
</style>
