<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import {
		budgetData,
		loadBudget,
		monthKey,
		monthLabel,
		prevMonth,
		nextMonth,
		ensureMonth,
		isDefaultCategory,
		DEFAULT_CATEGORIES,
		OPENING_ID
	} from '$lib/budget.js';
	import { displayBudgetEmoji } from '$lib/budgetEmoji.js';
	import {
		listExpenses,
		addExpense,
		updateExpense,
		deleteExpense,
		fetchBillImage,
		compressImage
	} from '$lib/expenses.js';

	const todayKey = monthKey();

	let month = todayKey;
	let catFilter = '';      // '' = all
	let expenses = [];
	let loading = false;
	let error = '';

	// Entry form
	let showForm = false;
	let editingId = null;
	let fCat = '';
	let fDate = todayStr();
	let fDesc = '';
	let fAmt = '';
	let fImage = null;       // { image, filename } from compressImage
	let fPreview = '';       // data URL for thumbnail
	let fHasBill = false;    // editing a row that already has a bill
	let lastAutoDesc = '';   // last auto-filled description — only clobber our own fill
	let saving = false;

	// Bill preview in list
	let billOpenId = null;
	let billSrc = '';
	let billLoading = false;

	$: rows = ensureMonth($budgetData, month);
	$: catList = buildCatList(rows);
	$: filtered = catFilter ? expenses.filter((e) => e.x_studio_category === catFilter) : expenses;
	$: filteredTotal = filtered.reduce((s, e) => s + (e.x_studio_amount || 0), 0);
	$: catById = Object.fromEntries(catList.map((c) => [c.id, c]));

	// Form renders inside {#if showForm}, so this fires each time it opens.
	function focusOnMount(node) {
		node.focus();
	}

	function todayStr() {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function buildCatList(r) {
		const all = [];
		for (const c of DEFAULT_CATEGORIES) {
			all.push({ id: c.id, label: c.label, ...(r[c.id] ?? {}) });
		}
		for (const [id, val] of Object.entries(r)) {
			if (id === OPENING_ID || isDefaultCategory(id)) continue;
			all.push({ id, ...val, label: val.label || id });
		}
		return all;
	}

	function fmt(n) {
		return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
	}

	function fmtDay(dateStr) {
		const d = new Date(dateStr + 'T00:00:00');
		return isNaN(d) ? dateStr : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
	}

	async function refresh() {
		loading = true;
		error = '';
		try {
			expenses = await listExpenses(month);
		} catch (e) {
			error = e?.message || 'Could not load expenses';
		} finally {
			loading = false;
		}
	}

	function goPrev() {
		month = prevMonth(month);
		closeBill();
		refresh();
	}
	function goNext() {
		if (month < todayKey) {
			month = nextMonth(month);
			closeBill();
			refresh();
		}
	}

	function openAdd(catId = '') {
		editingId = null;
		fCat = catId || catFilter || '';
		fDate = todayStr();
		fDesc = '';
		lastAutoDesc = '';
		fAmt = '';
		fImage = null;
		fPreview = '';
		fHasBill = false;
		showForm = true;
		autoFillDesc();
	}

	// Prefill description with category label; user edits stick.
	function autoFillDesc() {
		if (!fCat || (fDesc && fDesc !== lastAutoDesc)) return;
		fDesc = catById[fCat]?.label ?? fCat;
		lastAutoDesc = fDesc;
	}

	function openEdit(exp) {
		editingId = exp.id;
		fCat = exp.x_studio_category || '';
		fDate = exp.x_studio_date || todayStr();
		fDesc = exp.x_name || '';
		fAmt = String(exp.x_studio_amount ?? '');
		fImage = null;
		fPreview = '';
		fHasBill = !!exp.x_studio_bill_filename;
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingId = null;
		fImage = null;
		fPreview = '';
	}

	async function onFilePick(e) {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		try {
			fImage = await compressImage(file);
			fPreview = `data:image/jpeg;base64,${fImage.image}`;
		} catch {
			error = 'Could not read image';
		}
	}

	async function submitForm() {
		const payload = {
			category: fCat,
			date: fDate,
			description: fDesc,
			amount: parseFloat(fAmt)
		};
		// Only send image when a new file was picked — omitting it keeps an existing bill.
		if (fImage) {
			payload.image = fImage.image;
			payload.filename = fImage.filename;
		}
		saving = true;
		error = '';
		try {
			if (editingId) await updateExpense(editingId, payload);
			else await addExpense(payload);
			closeForm();
			await refresh();
		} catch (e) {
			error = e?.message || 'Could not save expense';
		} finally {
			saving = false;
		}
	}

	async function remove(exp) {
		error = '';
		try {
			await deleteExpense(exp.id);
			expenses = expenses.filter((x) => x.id !== exp.id);
			if (billOpenId === exp.id) closeBill();
		} catch (e) {
			error = e?.message || 'Could not delete';
		}
	}

	function closeBill() {
		billOpenId = null;
		billSrc = '';
	}

	async function toggleBill(exp) {
		if (billOpenId === exp.id) { closeBill(); return; }
		billOpenId = exp.id;
		billSrc = '';
		billLoading = true;
		try {
			const img = await fetchBillImage(exp.id);
			if (billOpenId === exp.id) billSrc = img ? `data:image/jpeg;base64,${img}` : '';
		} catch {
			if (billOpenId === exp.id) closeBill();
		} finally {
			billLoading = false;
		}
	}

	onMount(() => {
		const params = $page.url.searchParams;
		const m = params.get('month');
		if (m && /^\d{4}-\d{2}$/.test(m)) month = m;
		const cat = params.get('cat');
		if (cat) {
			catFilter = cat;
			openAdd(cat);
		}
		loadBudget();
		refresh();
	});
</script>

<svelte:head><title>Expenses · Daily Tracker</title></svelte:head>

<div class="app">
	<header>
		<button class="back" on:click={() => goto(`${base}/budget`)} aria-label="back">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1>Expenses</h1>
	</header>

	<!-- Month navigator -->
	<div class="month-nav">
		<button class="mnav" on:click={goPrev} aria-label="previous month">‹</button>
		<span class="mlabel">{monthLabel(month)}</span>
		<button class="mnav" on:click={goNext} disabled={month >= todayKey} aria-label="next month">›</button>
	</div>

	<!-- Filter + total -->
	<div class="bar card">
		<select class="cat-select" bind:value={catFilter} aria-label="filter by category">
			<option value="">All categories</option>
			{#each catList as c (c.id)}
				<option value={c.id}>{displayBudgetEmoji(c)} {c.label}</option>
			{/each}
		</select>
		<span class="bar-total">{fmt(filteredTotal)}</span>
	</div>

	<!-- Entry form -->
	<div class="form-card card">
		{#if showForm}
			<form on:submit|preventDefault={submitForm}>
				<div class="frow">
					<select class="cat-select grow" bind:value={fCat} on:change={autoFillDesc} required aria-label="category">
						<option value="" disabled>Category…</option>
						{#each catList as c (c.id)}
							<option value={c.id}>{displayBudgetEmoji(c)} {c.label}</option>
						{/each}
					</select>
					<input class="fdate" type="date" bind:value={fDate} max={todayStr()} required aria-label="date" />
				</div>
				<div class="frow">
					<input class="grow" type="text" placeholder="Description" maxlength="120" bind:value={fDesc} aria-label="description" />
					<input class="famt" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" bind:value={fAmt} use:focusOnMount required aria-label="amount" />
				</div>
				<div class="frow">
					<label class="bill-pick">
						<input type="file" accept="image/*" on:change={onFilePick} hidden />
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
						</svg>
						{fImage ? 'Change bill' : fHasBill ? 'Replace bill' : 'Attach bill'}
					</label>
					{#if fPreview}
						<img class="thumb" src={fPreview} alt="bill preview" />
					{:else if fHasBill}
						<span class="hint">has bill</span>
					{/if}
					<span class="spacer" />
					<button class="cancel-btn" type="button" on:click={closeForm}>Cancel</button>
					<button class="confirm-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update' : 'Add'}</button>
				</div>
			</form>
		{:else}
			<button class="add-open" on:click={() => openAdd()}>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 5v14M5 12h14" />
				</svg>
				Add expense
			</button>
		{/if}
	</div>

	{#if error}<p class="err">{error}</p>{/if}

	<!-- List -->
	{#if loading}
		<p class="hint center">Loading…</p>
	{:else if !filtered.length}
		<p class="hint center">No expenses{catFilter ? ' for this category' : ''} this month.</p>
	{:else}
		<div class="list">
			{#each filtered as exp (exp.id)}
				<div class="erow card">
					<button class="erow-main" on:click={() => openEdit(exp)} aria-label="edit {exp.x_name}">
						<span class="eemo emo" aria-hidden="true">{displayBudgetEmoji(catById[exp.x_studio_category] ?? { id: exp.x_studio_category })}</span>
						<span class="einfo">
							<span class="edesc">{exp.x_name}</span>
							<span class="emeta">{fmtDay(exp.x_studio_date)} · {catById[exp.x_studio_category]?.label ?? exp.x_studio_category}</span>
						</span>
						<span class="eamt">{fmt(exp.x_studio_amount)}</span>
					</button>
					{#if exp.x_studio_bill_filename}
						<button class="ebill" class:active={billOpenId === exp.id} on:click={() => toggleBill(exp)} aria-label="view bill">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
							</svg>
						</button>
					{/if}
					<button class="del" on:click={() => remove(exp)} aria-label="delete {exp.x_name}">
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
						</svg>
					</button>
				</div>
				{#if billOpenId === exp.id}
					<div class="bill-view card">
						{#if billLoading}
							<p class="hint center">Loading bill…</p>
						{:else if billSrc}
							<img src={billSrc} alt="bill for {exp.x_name}" />
						{:else}
							<p class="hint center">No image</p>
						{/if}
					</div>
				{/if}
			{/each}
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
	h1 {
		font-size: 1.6rem;
		font-variation-settings: 'SOFT' 50;
		letter-spacing: -0.02em;
	}

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
	}
	.mnav:disabled { opacity: 0.35; }
	.mlabel {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.1rem;
		letter-spacing: -0.01em;
		min-width: 160px;
		text-align: center;
	}

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		margin-bottom: 10px;
	}
	.bar-total {
		margin-left: auto;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.1rem;
		font-variant-numeric: tabular-nums;
	}
	.cat-select {
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-soft);
		color: var(--text);
		font-family: inherit;
		/* 16px min — smaller makes iOS Safari auto-zoom on focus and stay zoomed. */
		font-size: 16px;
	}
	.cat-select:focus { outline: none; border-color: var(--teal); }

	.form-card { margin-bottom: 14px; overflow: hidden; }
	form { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
	.frow { display: flex; align-items: center; gap: 8px; }
	.grow { flex: 1; min-width: 0; }
	.spacer { flex: 1; }
	input[type='text'],
	input[type='date'],
	input[type='number'] {
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-soft);
		color: var(--text);
		font-family: inherit;
		/* 16px min — smaller makes iOS Safari auto-zoom on focus and stay zoomed. */
		font-size: 16px;
	}
	input:focus { outline: none; border-color: var(--teal); }
	.famt {
		width: 110px;
		font-variant-numeric: tabular-nums;
		text-align: right;
		-moz-appearance: textfield;
	}
	.famt::-webkit-outer-spin-button,
	.famt::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
	.fdate { width: 150px; }

	.bill-pick {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 12px;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		cursor: pointer;
	}
	.thumb {
		width: 34px;
		height: 34px;
		border-radius: 6px;
		object-fit: cover;
		border: 1px solid var(--border);
	}
	.add-open {
		display: flex;
		align-items: center;
		gap: 7px;
		width: 100%;
		padding: 12px 14px;
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-faint);
	}
	@media (hover: hover) {
		.add-open:hover { color: var(--teal); }
	}
	.add-open:active { color: var(--teal); }
	.confirm-btn {
		padding: 7px 14px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.84rem;
		color: var(--on-accent);
		background: var(--teal);
	}
	.confirm-btn:disabled { opacity: 0.6; }
	.cancel-btn {
		padding: 7px 12px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.84rem;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
	}

	.list { display: flex; flex-direction: column; gap: 8px; }
	.erow {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 10px 12px;
	}
	.erow-main {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		text-align: left;
		color: var(--text);
	}
	.eemo { font-size: 1.05rem; flex-shrink: 0; }
	.einfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.edesc {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.emeta { font-size: 0.74rem; color: var(--text-faint); }
	.eamt {
		font-family: var(--font-display);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
	.ebill,
	.del {
		width: 28px;
		height: 28px;
		flex-shrink: 0;
		border-radius: 6px;
		display: grid;
		place-items: center;
		color: var(--text-faint);
	}
	.ebill.active { color: var(--teal); }
	@media (hover: hover) {
		.ebill:hover { color: var(--teal); }
		.del:hover { color: var(--red); background: color-mix(in srgb, var(--red) 12%, transparent); }
	}
	.del:active { color: var(--red); }
	.bill-view {
		padding: 10px;
	}
	.bill-view img {
		display: block;
		width: 100%;
		border-radius: 8px;
	}

	.hint { font-size: 0.82rem; color: var(--text-faint); }
	.center { text-align: center; padding: 18px 0; }
	.err {
		color: var(--red);
		font-size: 0.84rem;
		text-align: center;
		margin-bottom: 10px;
	}

	@media (max-width: 520px) {
		.fdate { width: 132px; }
		.mlabel { min-width: 130px; font-size: 0.96rem; }
	}
</style>
