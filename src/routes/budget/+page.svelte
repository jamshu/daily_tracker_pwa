<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import {
		budgetData,
		loadBudget,
		saveBudget,
		monthKey,
		monthLabel,
		prevMonth,
		nextMonth,
		ensureMonth,
		isDefaultCategory,
		calcRow,
		DEFAULT_CATEGORIES
	} from '$lib/budget.js';

	const todayKey = monthKey();

	let month = todayKey;
	let rows = {};       // { catId: { budget, actual } } — local editable copy
	let busy = false;
	let status = '';     // '' | 'saving' | 'saved' | 'error'
	let error = '';
	let addingCat = false;
	let newCatName = '';
	let saveTimer = null;

	// Sync rows from store whenever month or store changes
	$: rows = ensureMonth($budgetData, month);

	$: prevHasData = Object.values(ensureMonth($budgetData, prevMonth(month))).some(v => v.budget > 0);

	// Derived stats
	$: catList = buildCatList(rows);
	$: totalBudget = catList.reduce((s, r) => s + (r.budget || 0), 0);
	$: totalActual = catList.reduce((s, r) => s + (r.actual || 0), 0);
	$: totalDiff = totalActual - totalBudget;
	$: totalOver = totalDiff > 0;

	function buildCatList(r) {
		// Default categories first, then custom
		const all = [];
		for (const c of DEFAULT_CATEGORIES) {
			all.push({ id: c.id, label: c.label, ...r[c.id] ?? { budget: 0, actual: 0 } });
		}
		for (const [id, val] of Object.entries(r)) {
			if (isDefaultCategory(id)) continue;
			all.push({ id, label: id, ...val });
		}
		return all;
	}

	function fmt(n) {
		return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
	}

	function fmtPct(pct) {
		return pct === null ? '—' : `${Math.round(pct)}%`;
	}

	function fmtDiff(diff) {
		return diff === 0 ? '0' : (diff > 0 ? '+' : '') + fmt(diff);
	}

	function scheduleAutoSave() {
		clearTimeout(saveTimer);
		status = 'saving';
		saveTimer = setTimeout(save, 800);
	}

	function flushSave() {
		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = null;
			save();
		}
	}

	function setVal(id, field, raw) {
		const v = Math.max(0, parseFloat(raw) || 0);
		rows = { ...rows, [id]: { ...rows[id], [field]: v } };
		scheduleAutoSave();
	}

	function goPrev() {
		flushSave();
		const p = prevMonth(month);
		const limit = prevMonth(prevMonth(prevMonth(prevMonth(prevMonth(prevMonth(prevMonth(prevMonth(prevMonth(prevMonth(prevMonth(prevMonth(todayKey))))))))))));
		if (p >= limit) month = p;
	}
	function goNext() {
		flushSave();
		if (month < todayKey) month = nextMonth(month);
	}

	async function save() {
		busy = true;
		status = 'saving';
		error = '';
		try {
			await saveBudget(month, rows);
			status = 'saved';
			setTimeout(() => { if (status === 'saved') status = ''; }, 2200);
		} catch (e) {
			status = 'error';
			error = e?.message || 'Could not save';
		} finally {
			busy = false;
		}
	}

	function startAddCat() {
		addingCat = true;
		newCatName = '';
	}

	function confirmAddCat() {
		const name = newCatName.trim();
		if (!name) { addingCat = false; return; }
		const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
		if (!id || rows[id]) { addingCat = false; return; }
		rows = { ...rows, [id]: { budget: 0, actual: 0 } };
		addingCat = false;
		newCatName = '';
		scheduleAutoSave();
	}

	function copyFromPrev() {
		const prevKey = prevMonth(month);
		const prevRows = ensureMonth($budgetData, prevKey);
		const merged = { ...rows };
		for (const [id, val] of Object.entries(prevRows)) {
			if (val.budget > 0) {
				merged[id] = { actual: merged[id]?.actual ?? 0, budget: val.budget };
			}
		}
		rows = merged;
		scheduleAutoSave();
	}

	function deleteCat(id) {
		const { [id]: _, ...rest } = rows;
		rows = rest;
		scheduleAutoSave();
	}

	onMount(loadBudget);
</script>

<svelte:head><title>Budget · Daily Tracker</title></svelte:head>

<div class="app">
	<header>
		<button class="back" on:click={() => goto(`${base}/`)} aria-label="back">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1>Budget</h1>
	</header>

	<!-- Month navigator -->
	<div class="month-nav">
		<button class="mnav" on:click={goPrev} aria-label="previous month">‹</button>
		<span class="mlabel">{monthLabel(month)}</span>
		<button class="mnav" on:click={goNext} disabled={month >= todayKey} aria-label="next month">›</button>
		<button class="copy-btn" on:click={copyFromPrev} disabled={!prevHasData} title="Copy budgets from previous month">↑ Copy prev</button>
	</div>

	<!-- Summary bar -->
	<div class="summary card">
		<div class="stat">
			<span class="big">{fmt(totalBudget)}</span>
			<span class="lbl">Budget</span>
		</div>
		<div class="divider" />
		<div class="stat">
			<span class="big">{fmt(totalActual)}</span>
			<span class="lbl">Actual</span>
		</div>
		<div class="divider" />
		<div class="stat">
			<span class="big" class:over={totalOver} class:under={!totalOver && totalDiff !== 0}>{fmtDiff(totalDiff)}</span>
			<span class="lbl">{totalOver ? 'Over' : 'Under'}</span>
		</div>
	</div>

	<!-- Budget table -->
	<h2 class="section-title">Categories</h2>
	<div class="card table-card">
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th class="l">Category</th>
						<th>Budget</th>
						<th>Actual</th>
						<th>Diff</th>
						<th>%</th>
						<th class="del-col"></th>
					</tr>
				</thead>
				<tbody>
					{#each catList as cat (cat.id)}
						{@const calc = calcRow(cat)}
						<tr class:row-over={calc.over}>
							<td class="l cat-label">{cat.label}</td>
							<td>
								<input
									type="number"
									min="0"
									step="0.01"
									value={cat.budget}
									inputmode="decimal"
									on:change={(e) => setVal(cat.id, 'budget', e.target.value)}
									aria-label="{cat.label} budget"
								/>
							</td>
							<td>
								<input
									type="number"
									min="0"
									step="0.01"
									value={cat.actual}
									inputmode="decimal"
									on:change={(e) => setVal(cat.id, 'actual', e.target.value)}
									aria-label="{cat.label} actual"
								/>
							</td>
							<td class="num" class:red={calc.over} class:green={!calc.over && calc.diff < 0}>{fmtDiff(calc.diff)}</td>
							<td class="num" class:red={calc.over} class:green={calc.pct !== null && calc.pct <= 100}>{fmtPct(calc.pct)}</td>
							<td class="del-col">
								{#if !isDefaultCategory(cat.id)}
									<button class="del" on:click={() => deleteCat(cat.id)} aria-label="delete {cat.label}">
										<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
										</svg>
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="totals">
						<td class="l">Total</td>
						<td class="num bold">{fmt(totalBudget)}</td>
						<td class="num bold">{fmt(totalActual)}</td>
						<td class="num bold" class:red={totalOver} class:green={!totalOver && totalDiff !== 0}>{fmtDiff(totalDiff)}</td>
						<td class="num bold" class:red={totalOver} class:green={!totalOver && totalBudget > 0}>
							{totalBudget > 0 ? fmtPct((totalActual / totalBudget) * 100) : '—'}
						</td>
						<td class="del-col"></td>
					</tr>
				</tfoot>
			</table>
		</div>

		<!-- Add category -->
		{#if addingCat}
			<div class="add-row">
				<input
					class="cat-input"
					type="text"
					placeholder="Category name"
					bind:value={newCatName}
					on:keydown={(e) => e.key === 'Enter' && confirmAddCat()}
					autofocus
				/>
				<button class="confirm-btn" on:click={confirmAddCat}>Add</button>
				<button class="cancel-btn" on:click={() => (addingCat = false)}>Cancel</button>
			</div>
		{:else}
			<button class="add-cat" on:click={startAddCat}>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 5v14M5 12h14" />
				</svg>
				Add category
			</button>
		{/if}
	</div>

	<div class="autosave-status">
		{#if status === 'saving'}<span class="saving"><span class="spinner-sm" />Saving…</span>
		{:else if status === 'saved'}<span class="ok">Saved</span>
		{:else if status === 'error'}<span class="err">{error}</span>{/if}
	</div>
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
		margin-bottom: 8px;
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

	/* Month nav */
	.month-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		margin: 16px 0;
	}
	.mnav {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		font-size: 1.4rem;
		line-height: 1;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		display: grid;
		place-items: center;
		transition: all 0.15s ease;
	}
	.mnav:hover:not(:disabled) { border-color: var(--teal); }
	.mnav:disabled { opacity: 0.35; }
	.mlabel {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.1rem;
		letter-spacing: -0.01em;
		min-width: 160px;
		text-align: center;
	}

	/* Summary */
	.summary {
		display: flex;
		align-items: center;
		padding: 18px 20px;
		gap: 0;
		margin-bottom: 4px;
	}
	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	.big {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
	}
	.big.over { color: var(--red); }
	.big.under { color: var(--green); }
	.lbl {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-faint);
	}
	.divider {
		width: 1px;
		height: 36px;
		background: var(--border);
	}

	/* Table */
	.table-card {
		padding: 0;
		overflow: hidden;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}
	thead th {
		padding: 10px 8px;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-faint);
		font-weight: 700;
		border-bottom: 1px solid var(--border);
		background: var(--surface-2);
		text-align: center;
	}
	thead th.l { text-align: left; padding-left: 14px; }
	tbody td {
		padding: 8px 8px;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
		text-align: center;
		color: var(--text-dim);
	}
	tbody td.l { text-align: left; padding-left: 14px; }
	tbody tr:last-child td { border-bottom: none; }

	.row-over {
		background: color-mix(in srgb, var(--red) 5%, transparent);
	}

	.cat-label {
		font-weight: 600;
		color: var(--text);
		white-space: nowrap;
	}

	input[type='number'] {
		width: 80px;
		padding: 5px 6px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-soft);
		color: var(--text);
		font-size: 0.88rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
		font-family: inherit;
		-moz-appearance: textfield;
	}
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number']:focus {
		outline: none;
		border-color: var(--teal);
	}

	.num { font-variant-numeric: tabular-nums; }
	.red { color: var(--red); font-weight: 600; }
	.green { color: var(--green); font-weight: 600; }
	.bold { font-weight: 700; color: var(--text); }

	.del-col { width: 28px; padding: 0 8px 0 4px; }
	.del {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		display: grid;
		place-items: center;
		color: var(--text-faint);
		transition: all 0.15s ease;
	}
	.del:hover { color: var(--red); background: color-mix(in srgb, var(--red) 12%, transparent); }

	tfoot td {
		padding: 10px 8px;
		border-top: 2px solid var(--border);
		font-variant-numeric: tabular-nums;
		text-align: center;
	}
	tfoot td.l { text-align: left; padding-left: 14px; color: var(--text); font-weight: 700; }
	.totals { background: var(--surface-2); }

	/* Add category */
	.add-cat {
		display: flex;
		align-items: center;
		gap: 7px;
		width: 100%;
		padding: 12px 14px;
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-faint);
		border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
		transition: color 0.15s ease;
	}
	.add-cat:hover { color: var(--teal); }
	.add-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-top: 1px solid var(--border);
	}
	.cat-input {
		flex: 1;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--teal);
		background: var(--bg-soft);
		color: var(--text);
		font-family: inherit;
		font-size: 0.88rem;
	}
	.cat-input:focus { outline: none; }
	.confirm-btn {
		padding: 7px 14px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.84rem;
		color: #042f2a;
		background: var(--teal);
	}
	.cancel-btn {
		padding: 7px 12px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.84rem;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
	}

	.copy-btn {
		height: 32px;
		padding: 0 12px;
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		white-space: nowrap;
		transition: all 0.15s ease;
	}
	.copy-btn:hover:not(:disabled) { border-color: var(--teal); color: var(--teal); }
	.copy-btn:disabled { opacity: 0.35; }

	.autosave-status {
		min-height: 28px;
		margin-top: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.84rem;
	}
	.saving {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-faint);
	}
	.ok { color: var(--green); font-weight: 600; }
	.err { color: var(--red); }
	.spinner-sm {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		border: 2px solid color-mix(in srgb, var(--teal) 30%, transparent);
		border-top-color: var(--teal);
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	@media (max-width: 520px) {
		input[type='number'] { width: 64px; }
		.mlabel { min-width: 130px; font-size: 0.96rem; }
	}
</style>
