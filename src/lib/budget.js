// Custom budget store, backed by localdb. Pure calculations (category
// defaults, month-key arithmetic, aggregation) live in budgetCalc.js —
// re-exported here so existing imports of '$lib/budget.js' keep working.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import * as localdb from './localdb.js';

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

export async function loadBudget(force = false) {
	if (!browser || (loaded && !force)) return;
	loaded = true;
	budgetData.set(localdb.getBudget() || {});
}

export async function saveBudget(monthKeyVal, rows) {
	// Merge updated month into full dataset before persisting
	let current;
	budgetData.update((d) => {
		current = { ...d, [monthKeyVal]: rows };
		return current;
	});
	localdb.setBudget(current);
}
