<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { budgetData, loadBudget, monthLabel } from '$lib/budget.js';

	function fmt(n) {
		return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
	}

	$: rows = Object.entries($budgetData)
		.map(([key, cats]) => ({
			key,
			total: Object.values(cats).reduce((s, c) => s + (c.actual ?? 0), 0)
		}))
		.filter(r => r.total > 0)
		.sort((a, b) => b.key.localeCompare(a.key));

	$: grandTotal = rows.reduce((s, r) => s + r.total, 0);

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
		<div class="card report-card">
			<div class="rh">
				<span>Month</span>
				<span>Total Spent</span>
			</div>
			{#each rows as r (r.key)}
				<div class="rr">
					<span class="rlabel">{monthLabel(r.key)}</span>
					<span class="ramount">{fmt(r.total)}</span>
				</div>
			{/each}
			<div class="rtotal">
				<span>Grand Total</span>
				<span class="ramount">{fmt(grandTotal)}</span>
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
	.back:hover { background: var(--surface-2); }
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
	.report-card { padding: 0; }
	.rh {
		display: flex;
		justify-content: space-between;
		padding: 8px 16px;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-faint);
		font-weight: 700;
		border-bottom: 1px solid var(--border);
		background: var(--surface-2);
	}
	.rr {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
		font-size: 0.92rem;
	}
	.rr:last-of-type { border-bottom: none; }
	.rlabel {
		font-weight: 600;
		color: var(--text);
	}
	.ramount {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--text);
	}
	.rtotal {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 13px 16px;
		border-top: 2px solid var(--border);
		background: var(--surface-2);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text);
	}
	.rtotal .ramount {
		color: var(--teal);
		font-size: 1.1rem;
	}
</style>
