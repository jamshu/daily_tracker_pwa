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
		DEFAULT_CATEGORIES,
		OPENING_ID,
		getOpening
	} from '$lib/budget.js';
	import { displayBudgetEmoji } from '$lib/budgetEmoji.js';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';

	const todayKey = monthKey();

	let month = todayKey;
	let rows = {};       // { catId: { budget, actual } } — local editable copy
	let busy = false;
	let status = '';     // '' | 'saving' | 'saved' | 'error'
	let error = '';
	let addingCat = false;
	let newCatName = '';
	let newCatEmoji = '';
	let showEmojiPicker = false;
	let saveTimer = null;

	// Sync rows from store whenever month or store changes
	$: rows = ensureMonth($budgetData, month);

	$: prevHasData = hasCopyablePrev(ensureMonth($budgetData, prevMonth(month)));

	// Derived stats
	$: catList = buildCatList(rows);
	$: totalBudget = catList.reduce((s, r) => s + (r.budget || 0), 0);
	$: totalActual = catList.reduce((s, r) => s + (r.actual || 0), 0);
	$: totalDiff = totalActual - totalBudget;
	$: totalOver = totalDiff > 0;
	$: opening = getOpening(rows);
	$: closing = opening - totalActual;


	function hasCopyablePrev(prevRows) {
		// Enable copy if prev has any budgeted category OR a non-zero closing balance
		const prevActual = Object.entries(prevRows)
			.filter(([id]) => id !== OPENING_ID)
			.reduce((s, [, v]) => s + (v.actual ?? 0), 0);
		const prevClosing = getOpening(prevRows) - prevActual;
		if (prevClosing !== 0) return true;
		return Object.entries(prevRows).some(([id, v]) => id !== OPENING_ID && v.budget > 0);
	}

	function buildCatList(r) {
		// Default categories first, then custom
		const all = [];
		for (const c of DEFAULT_CATEGORIES) {
			all.push({ id: c.id, label: c.label, ...r[c.id] ?? { budget: 0, actual: 0 } });
		}
		for (const [id, val] of Object.entries(r)) {
			if (id === OPENING_ID || isDefaultCategory(id)) continue;
			all.push({ id, ...val, label: val.label || id });
		}
		// Cards with amounts rise to the top; empty ones keep their order below.
		const hasAmount = (c) => (c.budget || 0) > 0 || (c.actual || 0) > 0;
		return [...all.filter(hasAmount), ...all.filter((c) => !hasAmount(c))];
	}

	function fmt(n) {
		return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
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

	function setOpening(raw) {
		const v = Math.max(0, parseFloat(raw) || 0);
		rows = { ...rows, [OPENING_ID]: { budget: v, actual: 0 } };
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
		newCatEmoji = '';
		showEmojiPicker = false;
	}

	function cancelAddCat() {
		addingCat = false;
		newCatName = '';
		newCatEmoji = '';
		showEmojiPicker = false;
	}

	function confirmAddCat() {
		const name = newCatName.trim();
		if (!name) { cancelAddCat(); return; }
		const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
		if (!id || rows[id]) { cancelAddCat(); return; }
		const entry = { budget: 0, actual: 0, label: name };
		if (newCatEmoji) entry.emoji = newCatEmoji;
		rows = { ...rows, [id]: entry };
		cancelAddCat();
		scheduleAutoSave();
	}

	function copyFromPrev() {
		const prevKey = prevMonth(month);
		const prevRows = ensureMonth($budgetData, prevKey);
		const merged = { ...rows };
		for (const [id, val] of Object.entries(prevRows)) {
			if (id === OPENING_ID) continue;
			if (val.budget > 0) {
				merged[id] = { actual: merged[id]?.actual ?? 0, budget: val.budget, label: merged[id]?.label || val.label };
			}
		}
		// Carry prev month's closing balance (opening − spent) into this month's opening
		const prevActual = Object.entries(prevRows)
			.filter(([id]) => id !== OPENING_ID)
			.reduce((s, [, v]) => s + (v.actual ?? 0), 0);
		const prevClosing = getOpening(prevRows) - prevActual;
		if (prevClosing !== 0) {
			merged[OPENING_ID] = { budget: getOpening(merged) + prevClosing, actual: 0 };
		}
		rows = merged;
		scheduleAutoSave();
	}

	function deleteCat(id) {
		const { [id]: _, ...rest } = rows;
		rows = rest;
		scheduleAutoSave();
	}

	// Force reload — expense mutations denormalize actuals server-side.
	onMount(() => loadBudget(true));
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
		<button class="report-btn expenses-btn" on:click={() => goto(`${base}/budget/expenses?month=${month}`)}>Expenses</button>
		<button class="report-btn" on:click={() => goto(`${base}/budget/report`)}>Report</button>
	</header>

	<!-- Month navigator -->
	<div class="month-nav">
		<button class="mnav" on:click={goPrev} aria-label="previous month">‹</button>
		<span class="mlabel">{monthLabel(month)}</span>
		<button class="mnav" on:click={goNext} disabled={month >= todayKey} aria-label="next month">›</button>
		<button class="copy-btn" on:click={copyFromPrev} disabled={!prevHasData} title="Copy budgets from previous month">↑ Copy prev</button>
	</div>

	<!-- Opening / Closing balance -->
	<div class="hero card fade-in" style="--fade-delay:0.05s">
		<div class="bal-stat">
			<span class="lbl">Opening</span>
			<input
				class="opening-input"
				type="number"
				min="0"
				step="0.01"
				value={opening}
				inputmode="decimal"
				on:change={(e) => setOpening(e.target.value)}
				aria-label="opening balance"
			/>
		</div>
		<div class="divider" />
		<div class="bal-stat">
			<span class="lbl">Closing</span>
			<span class="big" class:over={closing < 0}>{fmt(closing)}</span>
		</div>
	</div>

	<!-- Summary tiles -->
	<div class="tiles fade-in" style="--fade-delay:0.10s">
		<div class="tile">
			<span class="tile-emo emo" aria-hidden="true">📊</span>
			<span class="tile-big">{fmt(totalBudget)}</span>
			<span class="tile-lbl">budget</span>
		</div>
		<div class="tile">
			<span class="tile-emo emo" aria-hidden="true">💸</span>
			<span class="tile-big">{fmt(totalActual)}</span>
			<span class="tile-lbl">actual</span>
		</div>
		<div class="tile">
			<span class="tile-emo emo" aria-hidden="true">{totalOver ? '⚠️' : '✅'}</span>
			<span class="tile-big" class:over={totalOver} class:under={!totalOver && totalDiff !== 0}>{fmtDiff(totalDiff)}</span>
			<span class="tile-lbl">{totalOver ? 'over' : 'under'}</span>
		</div>
	</div>

	<!-- Categories -->
	<h2 class="section-title">Categories</h2>
	<div class="cards fade-in" style="--fade-delay:0.15s">
		{#each catList as cat (cat.id)}
			{@const calc = calcRow(cat)}
			<div class="crow" class:crow-over={calc.over}>
				<div class="crow-top">
					<span class="cname"><span class="emo" aria-hidden="true">{displayBudgetEmoji(cat)}</span>{cat.label}</span>
					<span class="cdiff" class:red={calc.over} class:green={!calc.over && calc.diff < 0}>{fmtDiff(calc.diff)}</span>
					{#if !isDefaultCategory(cat.id)}
						<button class="del" on:click={() => deleteCat(cat.id)} aria-label="delete {cat.label}">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
							</svg>
						</button>
					{/if}
				</div>
				<div class="crow-inputs">
					<label class="cinput">
						<span class="cinput-lbl">Budget</span>
						<input
							type="number"
							min="0"
							step="0.01"
							value={cat.budget}
							inputmode="decimal"
							on:change={(e) => setVal(cat.id, 'budget', e.target.value)}
							aria-label="{cat.label} budget"
						/>
					</label>
					<span class="cinput">
						<span class="cinput-lbl">Actual</span>
						<div class="actual-cell">
							<span class="actual-val" aria-label="{cat.label} actual">{fmt(cat.actual ?? 0)}</span>
							<button class="add-exp" on:click={() => { flushSave(); goto(`${base}/budget/expenses?month=${month}&cat=${cat.id}`); }} aria-label="add expense to {cat.label}" title="Add expense">
								<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
									<path d="M12 5v14M5 12h14" />
								</svg>
							</button>
						</div>
					</span>
				</div>
				<span class="abar"><span class="abar-fill" class:over={calc.over} style="width:{Math.min(100, calc.pct ?? 0)}%"></span></span>
			</div>
		{/each}
	</div>

	<!-- Add category -->
	<div class="add-card fade-in" style="--fade-delay:0.18s">
		{#if addingCat}
			<div class="add-row">
				<button
					type="button"
					class="emo-chip emo"
					on:click={() => (showEmojiPicker = !showEmojiPicker)}
					aria-label="pick icon"
					aria-pressed={showEmojiPicker}
				>{newCatEmoji || '＋'}</button>
				<input
					class="cat-input"
					type="text"
					placeholder="Category name"
					bind:value={newCatName}
					on:keydown={(e) => e.key === 'Enter' && confirmAddCat()}
					autofocus
				/>
				<button class="confirm-btn" on:click={confirmAddCat}>Add</button>
				<button class="cancel-btn" on:click={cancelAddCat}>Cancel</button>
			</div>
			{#if showEmojiPicker}
				<div class="picker-wrap">
					<EmojiPicker value={newCatEmoji} on:select={(e) => (newCatEmoji = e.detail)} />
				</div>
			{/if}
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
	@media (hover: hover) {
		.back:hover { background: var(--surface-2); }
	}
	.back:active { background: var(--surface-2); }
	.report-btn + .report-btn { margin-left: 0; }
	.report-btn {
		margin-left: auto;
		padding: 7px 14px;
		border-radius: 10px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	@media (hover: hover) {
		.report-btn:hover { border-color: var(--teal); color: var(--teal); }
	}
	.report-btn:active { border-color: var(--teal); color: var(--teal); }
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
	@media (hover: hover) {
		.mnav:hover:not(:disabled) { border-color: var(--teal); }
	}
	.mnav:active:not(:disabled) { border-color: var(--teal); }
	.mnav:disabled { opacity: 0.35; }
	.mlabel {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.1rem;
		letter-spacing: -0.01em;
		min-width: 160px;
		text-align: center;
	}

	.big {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
	}
	.big.over { color: var(--red); }
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

	/* Opening / Closing balance */
	.hero {
		display: flex;
		align-items: center;
		padding: 16px 20px;
		gap: 0;
		margin-bottom: 4px;
	}
	.bal-stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	/* Summary tiles */
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
		font-size: 1.5rem;
		font-weight: 600;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		line-height: 1.1;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	.tile-big.over { color: var(--red); }
	.tile-big.under { color: var(--green); }
	.tile-lbl {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-faint);
	}
	.opening-input {
		width: 120px;
		padding: 6px 8px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-soft);
		color: var(--text);
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
		text-align: center;
		-moz-appearance: textfield;
	}
	.opening-input::-webkit-outer-spin-button,
	.opening-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
	.opening-input:focus { outline: none; border-color: var(--teal); }

	/* Per-row add expense */
	.actual-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
	}
	.add-exp {
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		border-radius: 6px;
		display: grid;
		place-items: center;
		color: var(--text-faint);
		background: var(--surface-2);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	@media (hover: hover) {
		.add-exp:hover { color: var(--teal); border-color: var(--teal); }
	}
	.add-exp:active { color: var(--teal); border-color: var(--teal); }
	.actual-val {
		min-width: 64px;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		text-align: right;
		color: var(--text);
	}

	/* Category rows */
	.cards {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.crow {
		display: flex;
		flex-direction: column;
		gap: 9px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 12px 14px;
	}
	.crow-over {
		background: color-mix(in srgb, var(--red) 5%, var(--surface));
	}
	.crow-top {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.cname {
		flex: 1;
		font-family: var(--font-display);
		font-weight: 600;
		color: var(--text);
	}
	.cname .emo {
		font-size: 0.95rem;
		margin-right: 8px;
	}
	.cdiff {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--text-dim);
	}
	.crow-inputs {
		display: flex;
		gap: 10px;
	}
	.cinput {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.cinput-lbl {
		font-size: 0.72rem;
		color: var(--text-faint);
		flex-shrink: 0;
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

	input[type='number'] {
		width: 80px;
		padding: 5px 6px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-soft);
		color: var(--text);
		/* 16px min — smaller makes iOS Safari auto-zoom on focus and stay zoomed. */
		font-size: 16px;
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

	.red { color: var(--red); font-weight: 600; }
	.green { color: var(--green); font-weight: 600; }

	.del {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		border-radius: 6px;
		display: grid;
		place-items: center;
		color: var(--text-faint);
		transition: all 0.15s ease;
	}
	@media (hover: hover) {
		.del:hover { color: var(--red); background: color-mix(in srgb, var(--red) 12%, transparent); }
	}
	.del:active { color: var(--red); background: color-mix(in srgb, var(--red) 12%, transparent); }

	/* Add category */
	.add-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	.add-cat {
		display: flex;
		align-items: center;
		gap: 7px;
		width: 100%;
		padding: 12px 14px;
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-faint);
		transition: color 0.15s ease;
	}
	@media (hover: hover) {
		.add-cat:hover { color: var(--teal); }
	}
	.add-cat:active { color: var(--teal); }
	.add-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
	}
	.emo-chip {
		width: 38px;
		height: 38px;
		flex-shrink: 0;
		border-radius: 8px;
		font-size: 1.1rem;
		display: grid;
		place-items: center;
		background: var(--bg-soft);
		border: 1px solid var(--border);
		transition: border-color 0.15s ease;
	}
	.emo-chip[aria-pressed='true'] {
		border-color: var(--teal);
	}
	.picker-wrap {
		padding: 0 14px 12px;
	}
	.cat-input {
		flex: 1;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--teal);
		background: var(--bg-soft);
		color: var(--text);
		font-family: inherit;
		/* 16px min — smaller makes iOS Safari auto-zoom on focus and stay zoomed. */
		font-size: 16px;
	}
	.cat-input:focus { outline: none; }
	.confirm-btn {
		padding: 7px 14px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.84rem;
		color: var(--on-accent);
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
	@media (hover: hover) {
		.copy-btn:hover:not(:disabled) { border-color: var(--teal); color: var(--teal); }
	}
	.copy-btn:active:not(:disabled) { border-color: var(--teal); color: var(--teal); }
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
