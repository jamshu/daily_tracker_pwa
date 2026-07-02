<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { PRAYERS, ACTIVITIES } from '$lib/config.js';
	import { dateKey, loadReportRange } from '$lib/store.js';
	import { settings, loadSettings } from '$lib/settings.js';
	import { userActivities, loadActivities } from '$lib/activities.js';
	import { aggregate, pct } from '$lib/report.js';

	const TABS = [
		['week', 'Week'],
		['month', 'Month'],
		['year', 'Year'],
		['all', 'All time']
	];
	let tab = 'week';
	let loading = true;
	let err = '';
	let agg = null;

	// Calendar periods: this week (Mon→today), this month (1st→today),
	// this year (Jan 1→today), all-time (no lower bound).
	function rangeFor(t) {
		const now = new Date();
		const end = dateKey(now);
		if (t === 'all') return { start: null, end };
		if (t === 'year') return { start: dateKey(new Date(now.getFullYear(), 0, 1)), end };
		if (t === 'month') return { start: dateKey(new Date(now.getFullYear(), now.getMonth(), 1)), end };
		const dow = (now.getDay() + 6) % 7; // 0 = Monday
		const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
		return { start: dateKey(mon), end };
	}

	async function refresh() {
		loading = true;
		err = '';
		try {
			const { start, end } = rangeFor(tab);
			const days = await loadReportRange(start, end);
			agg = aggregate(days, { userActivities: $userActivities, settings: $settings });
		} catch (e) {
			err = e?.message || 'Could not load report';
			agg = null;
		} finally {
			loading = false;
		}
	}

	function setTab(t) {
		if (t === tab) return;
		tab = t;
		refresh();
	}

	onMount(async () => {
		await Promise.all([loadSettings(), loadActivities()]);
		refresh();
	});

	// Prayer segments for the stacked bar (order + colour).
	const SEGS = [
		['jamath', 'Jamāʻah', 'var(--teal)'],
		['home', 'Alone', '#7c3aed'],
		['late', 'Late', '#f59e0b'],
		['missed', 'Missed', 'var(--red, #ef4444)']
	];

	// Additional (custom) activities as report rows.
	$: extraRows = $userActivities.map((ua) => ({ key: `act_${ua.id}`, name: ua.name }));
</script>

<svelte:head><title>Report — Daily Deed Tracker</title></svelte:head>

<div class="wrap">
	<header class="bar">
		<button class="back" on:click={() => goto(`${base}/`)} aria-label="back">‹</button>
		<h1>Report</h1>
		<span class="spacer" />
	</header>

	<div class="tabs" role="tablist">
		{#each TABS as [id, label]}
			<button role="tab" class:active={tab === id} on:click={() => setTab(id)}>{label}</button>
		{/each}
	</div>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if err}
		<p class="muted">{err}</p>
	{:else if agg}
		<p class="muted small">{agg.totalDays} day{agg.totalDays === 1 ? '' : 's'} tracked in this period.</p>

		<h2 class="section-title">Prayers</h2>
		<div class="cards">
			{#each PRAYERS as p (p.id)}
				{@const c = agg.prayers[p.id]}
				<div class="card">
					<div class="card-head"><span class="pname">{p.name}</span></div>
					<div class="segbar">
						{#each SEGS as [k, , colour]}
							{#if c[k]}<span class="seg" style="width:{pct(c[k], agg.totalDays)}%;background:{colour}" />{/if}
						{/each}
					</div>
					<div class="legend">
						{#each SEGS as [k, label, colour]}
							<span class="lg"><span class="sw" style="background:{colour}" />{label}
								<b>{pct(c[k], agg.totalDays)}%</b><span class="ct">({c[k]})</span></span>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<h2 class="section-title">Adhkār & Nawāfil</h2>
		<div class="cards">
			{#each Object.values(agg.deeds) as r}
				<div class="arow">
					<span class="aname">{r.name}</span>
					<span class="acount"><b>{r.completed}</b>/{r.total} days</span>
				</div>
			{/each}
			{#each Object.values(agg.nawafil) as r}
				<div class="arow">
					<span class="aname">{r.name}</span>
					<span class="acount"><b>{r.completed}</b>/{r.total} days</span>
				</div>
			{/each}
		</div>

		<h2 class="section-title">Activities</h2>
		<div class="cards">
			{#each ACTIVITIES as a (a.id)}
				{@const r = agg.activities[a.id]}
				<div class="arow">
					<span class="aname">{r.name}</span>
					<span class="acount"><b>{r.completed}</b>/{r.total} days</span>
				</div>
			{/each}
			{#each extraRows as e (e.key)}
				{@const r = agg.activities[e.key]}
				{#if r}
					<div class="arow">
						<span class="aname">{r.name}<span class="tagx">+</span></span>
						<span class="acount"><b>{r.completed}</b>/{r.total} days</span>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.wrap {
		max-width: var(--maxw, 560px);
		margin: 0 auto;
		padding: calc(12px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px))
			calc(48px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px));
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}
	.back {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		font-size: 1.6rem;
		line-height: 1;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.bar h1 {
		flex: 1;
		text-align: center;
		font-size: 1.2rem;
		font-weight: 800;
	}
	.spacer {
		width: 36px;
	}
	.tabs {
		display: flex;
		gap: 6px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 4px;
		margin-bottom: 14px;
	}
	.tabs button {
		flex: 1;
		height: 36px;
		border-radius: 999px;
		font-weight: 700;
		font-size: 0.86rem;
		color: var(--text-dim);
	}
	.tabs button.active {
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--green));
	}
	.muted {
		color: var(--text-dim);
		text-align: center;
		padding: 20px 0;
	}
	.muted.small {
		font-size: 0.8rem;
		padding: 0 0 8px;
	}
	.section-title {
		font-family: var(--font-display);
		font-size: 1.06rem;
		font-weight: 600;
		margin: 18px 0 10px;
	}
	.cards {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.card {
		background: var(--surface, var(--bg-soft));
		border: 1px solid var(--border);
		border-radius: var(--radius-sm, 12px);
		padding: 12px 14px;
	}
	.card-head {
		margin-bottom: 8px;
	}
	.pname {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.06rem;
	}
	.segbar {
		display: flex;
		height: 10px;
		border-radius: 999px;
		overflow: hidden;
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.seg {
		height: 100%;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 8px;
		font-size: 0.78rem;
		color: var(--text-dim);
	}
	.lg {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.sw {
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}
	.lg b {
		color: var(--text);
	}
	.ct {
		color: var(--text-faint);
	}
	.arow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--surface, var(--bg-soft));
		border: 1px solid var(--border);
		border-radius: var(--radius-sm, 12px);
		padding: 12px 14px;
	}
	.aname {
		font-family: var(--font-display);
		font-weight: 600;
	}
	.tagx {
		color: var(--teal);
		font-weight: 700;
		margin-left: 4px;
	}
	.acount {
		font-variant-numeric: tabular-nums;
		color: var(--text-dim);
		font-size: 0.9rem;
	}
	.acount b {
		color: var(--text);
		font-size: 1.05rem;
	}
</style>
