<script>
	import { createEventDispatcher } from 'svelte';
	export let dateK; // 'YYYY-MM-DD'
	export let todayK;
	const dispatch = createEventDispatcher();

	$: isToday = dateK === todayK;
	$: atFuture = dateK >= todayK; // block navigating past today

	$: label = (() => {
		const [y, m, d] = dateK.split('-').map(Number);
		const dt = new Date(y, m - 1, d);
		const opts = { weekday: 'long', day: 'numeric', month: 'long' };
		return dt.toLocaleDateString(undefined, opts);
	})();
</script>

<div class="nav">
	<button class="arrow" on:click={() => dispatch('prev')} aria-label="previous day">‹</button>
	<button class="center" on:click={() => dispatch('today')} title="Jump to today">
		<span class="tag">{isToday ? 'Today' : 'Selected'}</span>
		<span class="date">{label}</span>
	</button>
	<button
		class="arrow"
		on:click={() => dispatch('next')}
		disabled={atFuture}
		aria-label="next day">›</button
	>
</div>

<style>
	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 6px;
	}
	.arrow {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		font-size: 1.6rem;
		line-height: 1;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		display: grid;
		place-items: center;
		transition: all 0.15s ease;
	}
	.arrow:hover:not(:disabled) {
		background: var(--surface-2);
	}
	.arrow:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.center {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 4px;
	}
	.tag {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--teal);
		font-weight: 700;
	}
	.date {
		font-size: 1.05rem;
		font-weight: 700;
	}
</style>
