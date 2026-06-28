<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { budgetData, loadBudget, monthLabel, OPENING_ID } from '$lib/budget.js';

	function fmt(n) {
		return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
	}

	function fmtDiff(n) {
		if (n === 0) return '0';
		return (n > 0 ? '+' : '') + fmt(n);
	}

	$: rows = Object.entries($budgetData)
		.map(([key, cats]) => {
			const values = Object.entries(cats)
				.filter(([id]) => id !== OPENING_ID)
				.map(([, c]) => c);
			const total = values.reduce((s, c) => s + (c.actual ?? 0), 0);
			const budget = values.reduce((s, c) => s + (c.budget ?? 0), 0);
			return { key, total, budget, diff: total - budget };
		})
		.filter(r => r.total > 0)
		.sort((a, b) => a.key.localeCompare(b.key));

	$: grandTotal = rows.reduce((s, r) => s + r.total, 0);
	$: grandBudget = rows.reduce((s, r) => s + r.budget, 0);
	$: grandDiff = grandTotal - grandBudget;

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
				<span>Budget</span>
				<span>Spent</span>
				<span>Diff</span>
			</div>
			{#each rows as r (r.key)}
				<div class="rr" class:rr-over={r.diff > 0} class:rr-under={r.diff < 0}>
					<span class="rlabel">{monthLabel(r.key)}</span>
					<span class="ramount dim">{fmt(r.budget)}</span>
					<span class="ramount">{fmt(r.total)}</span>
					<span class="ramount" class:red={r.diff > 0} class:green={r.diff < 0}>{fmtDiff(r.diff)}</span>
				</div>
			{/each}
			<div class="rtotal">
				<span>Grand Total</span>
				<span class="ramount dim">{fmt(grandBudget)}</span>
				<span class="ramount teal">{fmt(grandTotal)}</span>
				<span class="ramount" class:red={grandDiff > 0} class:green={grandDiff < 0}>{fmtDiff(grandDiff)}</span>
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
		display: grid;
		grid-template-columns: 1fr 90px 90px 80px;
		gap: 12px;
		padding: 8px 16px;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-faint);
		font-weight: 700;
		border-bottom: 1px solid var(--border);
		background: var(--surface-2);
		text-align: right;
	}
	.rh span:first-child { text-align: left; }
	.rr {
		display: grid;
		grid-template-columns: 1fr 90px 90px 80px;
		gap: 12px;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
		font-size: 0.92rem;
		transition: background 0.15s ease;
	}
	.rr:last-of-type { border-bottom: none; }
	.rr-over  { background: color-mix(in srgb, var(--red)   5%, transparent); }
	.rr-under { background: color-mix(in srgb, var(--green) 5%, transparent); }
	.rlabel {
		font-weight: 600;
		color: var(--text);
	}
	.ramount {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--text);
		text-align: right;
	}
	.ramount.dim  { color: var(--text-faint); font-weight: 400; }
	.ramount.teal { color: var(--teal); }
	.red   { color: var(--red);   font-weight: 700; }
	.green { color: var(--green); font-weight: 700; }
	.rtotal {
		display: grid;
		grid-template-columns: 1fr 90px 90px 80px;
		gap: 12px;
		align-items: center;
		padding: 13px 16px;
		border-top: 2px solid var(--border);
		background: var(--surface-2);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text);
	}
</style>
