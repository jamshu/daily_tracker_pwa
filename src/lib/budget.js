import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';

export const DEFAULT_CATEGORIES = [
	{ id: 'rent',          label: 'Rent / Mortgage' },
	{ id: 'electricity',   label: 'Electricity' },
	{ id: 'water',         label: 'Water' },
	{ id: 'internet',      label: 'Internet' },
	{ id: 'grocery',       label: 'Grocery' },
	{ id: 'food',          label: 'Food' },
	{ id: 'school',        label: 'School' },
	{ id: 'kids',          label: 'Kids Expenses' },
	{ id: 'transport',     label: 'Transport / Fuel' },
	{ id: 'medical',       label: 'Medical' },
	{ id: 'entertainment', label: 'Entertainment' },
	{ id: 'clothing',      label: 'Clothing' },
	{ id: 'fines_rta',     label: 'Fines / RTA' },
	{ id: 'other',         label: 'Other' }
];

const DEFAULT_IDS = new Set(DEFAULT_CATEGORIES.map((c) => c.id));

/** Full months map: { "YYYY-MM": { catId: { budget, actual }, ... } } */
export const budgetData = writable({});

let loaded = false;

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

export async function loadBudget() {
	if (!browser || loaded) return;
	loaded = true;
	try {
		const res = await fetch(`${base}/api/budget`);
		const body = await res.json();
		if (!body.ok) throw new Error(body.error || 'Could not load budget');
		budgetData.set(body.data || {});
	} catch {
		loaded = false; // allow retry
	}
}

export async function saveBudget(monthKeyVal, rows) {
	// Merge updated month into full dataset before posting
	let current;
	budgetData.update((d) => {
		current = { ...d, [monthKeyVal]: rows };
		return current;
	});
	const res = await fetch(`${base}/api/budget`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ data: current })
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok || !body.ok) throw new Error(body.error || 'Could not save');
	budgetData.set(body.data || current);
}
