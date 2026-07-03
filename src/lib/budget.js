// Custom budget store + API calls. Pure calculations (category defaults,
// month-key arithmetic, aggregation) live in budgetCalc.js — re-exported here
// so existing imports of '$lib/budget.js' keep working unchanged.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';

export {
	DEFAULT_CATEGORIES,
	OPENING_ID,
	getOpening,
	monthKey,
	monthLabel,
	prevMonth,
	nextMonth,
	ensureMonth,
	isDefaultCategory,
	calcRow,
	summarizeBudget
} from './budgetCalc.js';

/** Full months map: { "YYYY-MM": { catId: { budget, actual }, ... } } */
export const budgetData = writable({});

let loaded = false;

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
