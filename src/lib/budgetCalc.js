// Pure budget calculations — category defaults, month-key arithmetic, and
// aggregation. No SvelteKit imports, so this is directly testable with plain
// node (budget.test.mjs). budget.js re-exports these alongside the store/API.

export const DEFAULT_CATEGORIES = [
	{ id: 'rent', label: 'Rent / Mortgage' },
	{ id: 'electricity', label: 'Electricity' },
	{ id: 'water', label: 'Water' },
	{ id: 'internet', label: 'Internet' },
	{ id: 'phone', label: 'Phone' },
	{ id: 'grocery', label: 'Grocery' },
	{ id: 'food', label: 'Food' },
	{ id: 'school', label: 'School' },
	{ id: 'kids', label: 'Kids Expenses' },
	{ id: 'transport', label: 'Transport / Fuel' },
	{ id: 'medical', label: 'Medical' },
	{ id: 'entertainment', label: 'Entertainment' },
	{ id: 'clothing', label: 'Clothing' },
	{ id: 'fines_rta', label: 'Fines / RTA' },
	{ id: 'other', label: 'Other' }
];

const DEFAULT_IDS = new Set(DEFAULT_CATEGORIES.map((c) => c.id));

/** Reserved pseudo-category storing the month's opening balance in its `.budget`. */
export const OPENING_ID = '$opening';

/** Read the opening balance amount from a month's rows. */
export function getOpening(rows) {
	return rows?.[OPENING_ID]?.budget ?? 0;
}

export function monthKey(d = new Date()) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	return `${y}-${m}`;
}

export function monthLabel(key) {
	const [y, m] = key.split('-').map(Number);
	return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function prevMonth(key) {
	const [y, m] = key.split('-').map(Number);
	const d = new Date(y, m - 2, 1);
	return monthKey(d);
}

export function nextMonth(key) {
	const [y, m] = key.split('-').map(Number);
	const d = new Date(y, m, 1);
	return monthKey(d);
}

/** Return rows for a month, seeding defaults if the month has no data yet. */
export function ensureMonth(data, key) {
	const existing = data[key];
	if (existing) {
		// Merge any missing default categories in at 0/0
		const merged = {};
		for (const c of DEFAULT_CATEGORIES) merged[c.id] = existing[c.id] ?? { budget: 0, actual: 0 };
		// Append custom categories
		for (const [id, val] of Object.entries(existing)) {
			if (!DEFAULT_IDS.has(id)) merged[id] = val;
		}
		return merged;
	}
	// Fresh month
	const fresh = {};
	for (const c of DEFAULT_CATEGORIES) fresh[c.id] = { budget: 0, actual: 0 };
	return fresh;
}

export function isDefaultCategory(id) {
	return DEFAULT_IDS.has(id);
}

/** Compute diff + pct for a single { budget, actual } row. */
export function calcRow(row) {
	const b = row.budget ?? 0;
	const a = row.actual ?? 0;
	const diff = a - b;
	const pct = b > 0 ? (a / b) * 100 : null;
	return { diff, pct, over: diff > 0 };
}

/**
 * Headline stats across all months with recorded spend, for the budget
 * report's tiles and per-month bars.
 * @param monthsData  full budgetData map: { "YYYY-MM": { catId: {budget,actual,...} } }
 * @returns { rows: [{key,budget,total,diff}], grandTotal, grandBudget, grandDiff, avgDiff, bestMonth }
 */
export function summarizeBudget(monthsData) {
	const rows = Object.entries(monthsData)
		.map(([key, cats]) => {
			const values = Object.entries(cats)
				.filter(([id]) => id !== OPENING_ID)
				.map(([, c]) => c);
			const total = values.reduce((s, c) => s + (c.actual ?? 0), 0);
			const budget = values.reduce((s, c) => s + (c.budget ?? 0), 0);
			return { key, total, budget, diff: total - budget };
		})
		.filter((r) => r.total > 0)
		.sort((a, b) => a.key.localeCompare(b.key));

	const grandTotal = rows.reduce((s, r) => s + r.total, 0);
	const grandBudget = rows.reduce((s, r) => s + r.budget, 0);
	const grandDiff = grandTotal - grandBudget;
	const avgDiff = rows.length ? grandDiff / rows.length : 0;
	// "Best month" = lowest total spend. Current month excluded — it's always
	// partial, so it would always win.
	const currentKey = monthKey();
	const bestMonth = rows.reduce(
		(best, r) => (r.key !== currentKey && (!best || r.total < best.total) ? r : best),
		null
	);

	return { rows, grandTotal, grandBudget, grandDiff, avgDiff, bestMonth };
}
