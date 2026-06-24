<script>
	import { fifa } from '$lib/fifa.js';
	import {
		upcomingMatches,
		dayResults,
		groupStandings,
		topScorers
	} from '$lib/fifa.js';

	let tab = 'upcoming'; // 'upcoming' | 'yesterday' | 'standings' | 'scorers'
	const TABS = [
		['upcoming', 'Upcoming'],
		['yesterday', 'Yesterday'],
		['standings', 'Standings'],
		['scorers', 'Scorers']
	];

	$: matches = $fifa.matches;
	$: upcoming = upcomingMatches(matches, 5);
	$: results = dayResults(matches);
	$: standings = groupStandings(matches);
	$: scorers = topScorers(matches, 10);

	// Standings has one mini-table per group; track which group is shown.
	let stdGroup = null;
	$: if (standings.length && (stdGroup === null || !standings.some((s) => s.group === stdGroup))) {
		stdGroup = standings[0].group;
	}
	$: shownStanding = standings.find((s) => s.group === stdGroup);

	function fmtDate(d) {
		const [y, m, day] = d.split('-').map(Number);
		return new Date(y, m - 1, day).toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="fifa card">
	<div class="head">
		<span class="badge">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="9" />
				<path d="M12 7l4.5 3.3-1.7 5.3h-5.6L7.5 10.3 12 7z" />
			</svg>
		</span>
		<div class="titles">
			<strong>World Cup 2026</strong>
			<small>Fixtures · results · stats</small>
		</div>
	</div>

	<div class="tabs" role="tablist">
		{#each TABS as [id, label]}
			<button
				type="button"
				role="tab"
				class:active={tab === id}
				aria-selected={tab === id}
				on:click={() => (tab = id)}>{label}</button
			>
		{/each}
	</div>

	<div class="body">
		{#if !$fifa.loaded}
			<div class="state">Loading fixtures…</div>
		{:else if $fifa.error}
			<div class="state err">{$fifa.error}</div>
		{:else if tab === 'upcoming'}
			{#if upcoming.length}
				<ul class="list">
					{#each upcoming as m}
						<li class="match">
							<div class="when">
								<span class="d">{fmtDate(m.date)}</span>
								{#if m.time}<span class="t">{m.time}</span>{/if}
							</div>
							<div class="teams">{m.team1} <span class="v">v</span> {m.team2}</div>
							<div class="meta">{m.group}{#if m.ground} · {m.ground}{/if}</div>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="state">Schedule TBD</div>
			{/if}
		{:else if tab === 'yesterday'}
			{#if results.length}
				<ul class="list">
					{#each results as r}
						<li class="result">
							<div class="score-row">
								<span class="tn">{r.team1}</span>
								<span class="score">{r.ft[0]}–{r.ft[1]}</span>
								<span class="tn right">{r.team2}</span>
							</div>
							{#if r.scorers1.length || r.scorers2.length}
								<div class="scorers">
									<div class="side">
										{#each r.scorers1 as g}
											<span class="chip">{g.name} {g.minute}'{#if g.penalty} (P){/if}</span>
										{/each}
									</div>
									<div class="side right">
										{#each r.scorers2 as g}
											<span class="chip">{g.name} {g.minute}'{#if g.penalty} (P){/if}</span>
										{/each}
									</div>
								</div>
							{/if}
							<a class="hl" href={r.ytUrl} target="_blank" rel="noopener">Highlights ↗</a>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="state">No matches yesterday</div>
			{/if}
		{:else if tab === 'standings'}
			{#if standings.length}
				<div class="grp-tabs">
					{#each standings as s}
						<button
							type="button"
							class:active={stdGroup === s.group}
							on:click={() => (stdGroup = s.group)}>{s.group.replace('Group ', '')}</button
						>
					{/each}
				</div>
				{#if shownStanding}
					<table class="std">
						<thead>
							<tr><th class="l">{shownStanding.group}</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
						</thead>
						<tbody>
							{#each shownStanding.rows as row}
								<tr>
									<td class="l">{row.team}</td>
									<td>{row.P}</td><td>{row.W}</td><td>{row.D}</td><td>{row.L}</td>
									<td>{row.GD > 0 ? '+' : ''}{row.GD}</td>
									<td class="pts">{row.Pts}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			{:else}
				<div class="state">No results yet</div>
			{/if}
		{:else if tab === 'scorers'}
			{#if scorers.length}
				<ol class="scorer-list">
					{#each scorers as s, i}
						<li>
							<span class="rank">{i + 1}</span>
							<span class="name">{s.name}</span>
							<span class="goals">{s.goals}</span>
						</li>
					{/each}
				</ol>
			{:else}
				<div class="state">No goals yet</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.fifa {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.badge {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		border-radius: 11px;
		display: grid;
		place-items: center;
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--gold));
	}
	.titles {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.titles strong {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.12rem;
		letter-spacing: -0.01em;
	}
	.titles small {
		font-size: 0.76rem;
		color: var(--text-dim);
	}
	.tabs {
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: 999px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.tabs button {
		flex: 1;
		padding: 7px 6px;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-dim);
		transition: all 0.15s ease;
	}
	.tabs button.active {
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--teal-deep));
	}
	.body {
		min-height: 80px;
	}
	.state {
		padding: 22px 8px;
		text-align: center;
		font-size: 0.88rem;
		color: var(--text-faint);
	}
	.state.err {
		color: var(--red);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.match,
	.result {
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		border: 1px solid var(--border);
	}
	.match {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-areas: 'when teams' 'when meta';
		column-gap: 12px;
		row-gap: 2px;
		align-items: center;
	}
	.when {
		grid-area: when;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 64px;
	}
	.when .d {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text);
	}
	.when .t {
		font-size: 0.72rem;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}
	.teams {
		grid-area: teams;
		font-weight: 600;
		font-size: 0.94rem;
	}
	.teams .v {
		color: var(--text-faint);
		font-weight: 400;
		margin: 0 2px;
	}
	.meta {
		grid-area: meta;
		font-size: 0.74rem;
		color: var(--text-faint);
	}
	/* results */
	.result {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.score-row {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 10px;
	}
	.tn {
		font-weight: 600;
		font-size: 0.94rem;
	}
	.tn.right {
		text-align: right;
	}
	.score {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.1rem;
		font-variant-numeric: tabular-nums;
		padding: 2px 10px;
		border-radius: 999px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.scorers {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 3px;
		align-items: flex-start;
	}
	.side.right {
		align-items: flex-end;
	}
	.chip {
		font-size: 0.72rem;
		color: var(--text-dim);
		font-variant-numeric: tabular-nums;
	}
	.hl {
		align-self: flex-start;
		font-size: 0.76rem;
		font-weight: 600;
		color: var(--teal);
		text-decoration: none;
	}
	.hl:hover {
		text-decoration: underline;
	}
	/* standings */
	.grp-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-bottom: 10px;
	}
	.grp-tabs button {
		width: 30px;
		height: 28px;
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	.grp-tabs button.active {
		color: var(--text);
		border-color: var(--teal);
	}
	.std {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.82rem;
		font-variant-numeric: tabular-nums;
	}
	.std th,
	.std td {
		padding: 6px 4px;
		text-align: center;
		color: var(--text-dim);
	}
	.std th {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-faint);
		border-bottom: 1px solid var(--border);
	}
	.std .l {
		text-align: left;
		color: var(--text);
		font-weight: 600;
	}
	.std td.pts {
		color: var(--text);
		font-weight: 700;
	}
	.std tbody tr:not(:last-child) td {
		border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}
	/* scorers */
	.scorer-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.scorer-list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 7px 4px;
	}
	.scorer-list li:not(:last-child) {
		border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}
	.rank {
		flex-shrink: 0;
		width: 22px;
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}
	.scorer-list .name {
		flex: 1;
		font-weight: 600;
		font-size: 0.92rem;
	}
	.goals {
		font-family: var(--font-display);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--teal);
	}
</style>
