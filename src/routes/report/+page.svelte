<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { PRAYERS, ACTIVITIES, DEEDS, NAWAFIL } from '$lib/config.js';
	import { dateKey, loadReportRange } from '$lib/store.js';
	import { settings, loadSettings } from '$lib/settings.js';
	import { userActivities, loadActivities } from '$lib/activities.js';
	import { aggregate, pct, summarize } from '$lib/report.js';
	import { displayEmoji } from '$lib/emoji.js';

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
	let sum = null;

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
			sum = summarize(days, { settings: $settings });
		} catch (e) {
			err = e?.message || 'Could not load report';
			agg = null;
			sum = null;
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
		['home', 'Alone', 'var(--teal-deep)'],
		['late', 'Late', 'var(--amber)'],
		['missed', 'Missed', 'var(--red, #ef4444)']
	];

	// Additional (custom) activities as report rows.
	$: extraRows = $userActivities.map((ua) => ({ key: `act_${ua.id}`, name: ua.name, emoji: displayEmoji(ua) }));

	// Best-day date as a short human label ("2 Jul").
	const shortDate = (key) => {
		const [y, m, d] = key.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	};
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

		{#if sum}
			<div class="tiles">
				<div class="tile">
					<span class="tile-emo emo" aria-hidden="true">🔥</span>
					<span class="tile-big">{sum.streak}</span>
					<span class="tile-lbl">day streak</span>
				</div>
				<div class="tile">
					<span class="tile-emo emo" aria-hidden="true">🏆</span>
					<span class="tile-big">{sum.bestDay ? Math.round(sum.bestDay.score * 100) : '—'}</span>
					<span class="tile-lbl">{sum.bestDay ? `best · ${shortDate(sum.bestDay.date)}` : 'best day'}</span>
				</div>
				<div class="tile">
					<span class="tile-emo emo" aria-hidden="true">💯</span>
					<span class="tile-big">{sum.perfectDays}</span>
					<span class="tile-lbl">perfect days</span>
				</div>
			</div>
		{/if}

		<h2 class="section-title">Prayers</h2>
		<div class="cards">
			{#each PRAYERS as p (p.id)}
				{@const c = agg.prayers[p.id]}
				<div class="card">
					<div class="card-head"><span class="pname"><span class="emo" aria-hidden="true">{p.emoji}</span>{p.name}</span></div>
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
			{#each DEEDS as d (d.id)}
				{@const r = agg.deeds[d.id]}
				<div class="arow">
					<div class="arow-top">
						<span class="aname"><span class="emo" aria-hidden="true">{d.emoji}</span>{r.name}</span>
						<span class="acount"><b>{r.completed}</b>/{r.total} days</span>
					</div>
					<span class="abar"><span class="abar-fill" style="width:{pct(r.completed, r.total)}%"></span></span>
				</div>
			{/each}
			{#each NAWAFIL as n (n.id)}
				{@const r = agg.nawafil[n.id]}
				<div class="arow">
					<div class="arow-top">
						<span class="aname"><span class="emo" aria-hidden="true">{n.emoji}</span>{r.name}</span>
						<span class="acount"><b>{r.completed}</b>/{r.total} days</span>
					</div>
					<span class="abar"><span class="abar-fill" style="width:{pct(r.completed, r.total)}%"></span></span>
				</div>
			{/each}
		</div>

		<h2 class="section-title">Activities</h2>
		<div class="cards">
			{#each ACTIVITIES as a (a.id)}
				{@const r = agg.activities[a.id]}
				<div class="arow">
					<div class="arow-top">
						<span class="aname"><span class="emo" aria-hidden="true">{a.emoji}</span>{r.name}</span>
						<span class="acount"><b>{r.completed}</b>/{r.total} days</span>
					</div>
					<span class="abar"><span class="abar-fill" style="width:{pct(r.completed, r.total)}%"></span></span>
				</div>
			{/each}
			{#each extraRows as e (e.key)}
				{@const r = agg.activities[e.key]}
				{#if r}
					<div class="arow">
						<div class="arow-top">
							<span class="aname"><span class="emo" aria-hidden="true">{e.emoji}</span>{r.name}<span class="tagx">+</span></span>
							<span class="acount"><b>{r.completed}</b>/{r.total} days</span>
						</div>
						<span class="abar"><span class="abar-fill gold" style="width:{pct(r.completed, r.total)}%"></span></span>
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
		color: var(--on-accent);
		background: linear-gradient(135deg, var(--teal), var(--green));
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 4px;
	}
	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: 14px 8px 12px;
		background: var(--surface, var(--bg-soft));
		border: 1px solid var(--border);
		border-radius: var(--radius-sm, 12px);
		text-align: center;
	}
	.tile-emo {
		font-size: 1.15rem;
	}
	.tile-big {
		font-family: var(--font-display);
		font-size: 1.65rem;
		font-weight: 600;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		line-height: 1.1;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	.tile-lbl {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-faint);
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
	.pname .emo {
		font-size: 0.95rem;
		margin-right: 8px;
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
		transform-origin: left;
		animation: grow 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	@keyframes grow {
		from {
			transform: scaleX(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.seg {
			animation: none;
		}
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
		flex-direction: column;
		gap: 9px;
		background: var(--surface, var(--bg-soft));
		border: 1px solid var(--border);
		border-radius: var(--radius-sm, 12px);
		padding: 12px 14px;
	}
	.arow-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.aname {
		font-family: var(--font-display);
		font-weight: 600;
	}
	.aname .emo {
		font-size: 0.95rem;
		margin-right: 8px;
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
	.abar-fill.gold {
		background: var(--gold);
	}
	@media (prefers-reduced-motion: reduce) {
		.abar-fill {
			animation: none;
		}
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
