<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { budgetData, loadBudget, monthLabel, summarizeBudget } from '$lib/budget.js';

	function fmt(n) {
		return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
	}

	function fmtDiff(n) {
		if (n === 0) return '0';
		return (n > 0 ? '+' : '') + fmt(n);
	}

	function pct(spent, budget) {
		if (!budget) return spent > 0 ? 100 : 0;
		return Math.min(100, Math.round((spent / budget) * 100));
	}

	$: ({ rows, grandTotal, grandBudget, grandDiff, avgDiff, bestMonth } = summarizeBudget($budgetData));

	onMount(loadBudget);
</script>

<svelte:head><title>Expense Report · Daily Tracker</title></svelte:head>

<div class="app">
	<header>
		<button class="back" on:click={() => goto(`${base}/budget`)} aria-label="back">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1>Expense Report</h1>
	</header>

	{#if rows.length === 0}
		<p class="empty">No expense data recorded yet.</p>
	{:else}
		<div class="tiles fade-in" style="--fade-delay:0.05s">
			<div class="tile">
				<span class="tile-emo emo" aria-hidden="true">💰</span>
				<span class="tile-big">{fmt(grandTotal)}</span>
				<span class="tile-lbl">total spent</span>
			</div>
			<div class="tile">
				<span class="tile-emo emo" aria-hidden="true">{avgDiff <= 0 ? '📉' : '📈'}</span>
				<span class="tile-big" class:red={avgDiff > 0} class:green={avgDiff < 0}>{fmtDiff(Math.round(avgDiff))}</span>
				<span class="tile-lbl">avg over/under</span>
			</div>
			<div class="tile">
				<span class="tile-emo emo" aria-hidden="true">🏆</span>
				<span class="tile-big">{bestMonth ? fmt(bestMonth.total) : '—'}</span>
				<span class="tile-lbl">{bestMonth ? `best · ${monthLabel(bestMonth.key)}` : 'best month'}</span>
			</div>
		</div>

		<div class="cards fade-in" style="--fade-delay:0.10s">
			{#each rows as r (r.key)}
				<button class="mrow" class:mrow-over={r.diff > 0} on:click={() => goto(`${base}/budget?month=${r.key}`)} aria-label="open {monthLabel(r.key)} budget">
					<div class="mrow-top">
						<span class="mname">{monthLabel(r.key)}</span>
						<span class="mnums">
							<span class="mspent">{fmt(r.total)}</span>
							<span class="mbudget dim"> / {fmt(r.budget)}</span>
							<span class="mdiff" class:red={r.diff > 0} class:green={r.diff < 0}>{fmtDiff(r.diff)}</span>
						</span>
					</div>
					<span class="abar"><span class="abar-fill" class:over={r.diff > 0} style="width:{pct(r.total, r.budget)}%"></span></span>
				</button>
			{/each}
			<div class="mrow mtotal">
				<div class="mrow-top">
					<span class="mname">Grand Total</span>
					<span class="mnums">
						<span class="mspent teal">{fmt(grandTotal)}</span>
						<span class="mbudget dim"> / {fmt(grandBudget)}</span>
						<span class="mdiff" class:red={grandDiff > 0} class:green={grandDiff < 0}>{fmtDiff(grandDiff)}</span>
					</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.app {
		max-width: 700px;
		margin: 0 auto;
		padding: calc(20px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px))
			calc(64px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px));
	}
	header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
	}
	.back {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		display: grid;
		place-items: center;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
	}
	@media (hover: hover) {
		.back:hover { background: var(--surface-2); }
	}
	.back:active { background: var(--surface-2); }
	h1 {
		font-size: 1.6rem;
		font-variation-settings: 'SOFT' 50;
		letter-spacing: -0.02em;
	}
	.empty {
		text-align: center;
		color: var(--text-faint);
		margin-top: 60px;
		font-size: 0.9rem;
	}
	/* Stat tiles */
	.tiles {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 14px;
	}
	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: 14px 8px 12px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		text-align: center;
	}
	.tile-emo {
		font-size: 1.15rem;
	}
	.tile-big {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 600;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		line-height: 1.1;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	.tile-big.red { color: var(--red); }
	.tile-big.green { color: var(--green); }
	.tile-lbl {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-faint);
	}

	/* Per-month rows */
	.cards {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.mrow {
		display: flex;
		flex-direction: column;
		gap: 9px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 12px 16px;
		text-align: left;
		font: inherit;
		color: inherit;
		width: 100%;
	}
	@media (hover: hover) {
		button.mrow:hover { border-color: var(--teal); }
	}
	button.mrow:active { border-color: var(--teal); }
	.mrow-over {
		background: color-mix(in srgb, var(--red) 5%, var(--surface));
	}
	.mrow-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}
	.mname {
		font-family: var(--font-display);
		font-weight: 600;
		color: var(--text);
	}
	.mnums {
		font-variant-numeric: tabular-nums;
		font-size: 0.92rem;
	}
	.mspent {
		font-weight: 700;
		color: var(--text);
	}
	.mspent.teal { color: var(--teal); }
	.mbudget.dim { color: var(--text-faint); }
	.mdiff {
		margin-left: 8px;
		font-weight: 600;
		color: var(--text-dim);
	}
	.mdiff.red { color: var(--red); }
	.mdiff.green { color: var(--green); }
	.mtotal {
		background: var(--surface-2);
	}
	.abar {
		display: block;
		height: 8px;
		border-radius: 999px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
		overflow: hidden;
	}
	.abar-fill {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: var(--teal);
		transform-origin: left;
		animation: grow 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.abar-fill.over {
		background: var(--red);
	}
	@keyframes grow {
		from { transform: scaleX(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.abar-fill { animation: none; }
	}
</style>
