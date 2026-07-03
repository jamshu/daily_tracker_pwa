// Runnable check: budget summary — totals, per-month rows, and "best month"
// (lowest total spend) across the saved budgetData map.
// Run: node src/lib/budget.test.mjs
import assert from 'node:assert';
import { summarizeBudget, OPENING_ID } from './budgetCalc.js';

// Empty input → zeroed output, no rows.
const empty = summarizeBudget({});
assert.deepStrictEqual(empty.rows, [], 'no rows for empty input');
assert.strictEqual(empty.grandTotal, 0);
assert.strictEqual(empty.grandBudget, 0);
assert.strictEqual(empty.avgDiff, 0);
assert.strictEqual(empty.bestMonth, null);

// A month with total === 0 (no actual spend) is excluded even if budgeted.
const months = {
	'2026-01': { rent: { budget: 1000, actual: 0 } },
	'2026-02': { rent: { budget: 1000, actual: 900 }, food: { budget: 300, actual: 250 } },
	'2026-03': { rent: { budget: 1000, actual: 1200 } },
	[OPENING_ID]: { budget: 5000, actual: 0 } // pseudo-category, not a real month key
};

const s = summarizeBudget(months);
assert.strictEqual(s.rows.length, 2, 'zero-spend month excluded');
assert.deepStrictEqual(
	s.rows.map((r) => r.key),
	['2026-02', '2026-03'],
	'chronological order'
);

const feb = s.rows.find((r) => r.key === '2026-02');
assert.strictEqual(feb.total, 1150, 'feb total sums actual across categories');
assert.strictEqual(feb.budget, 1300, 'feb budget sums budget across categories');
assert.strictEqual(feb.diff, -150, 'feb under budget');

assert.strictEqual(s.grandTotal, 2350, 'grand total = feb + march actual');
assert.strictEqual(s.grandBudget, 2300, 'grand budget = feb + march budget');
assert.strictEqual(s.grandDiff, 50, 'grand diff = total - budget');
assert.strictEqual(s.avgDiff, 25, 'avg diff divides by months with spend only (2)');

// Best month = lowest total spend, not lowest diff.
assert.strictEqual(s.bestMonth.key, '2026-02', 'best month is lowest total spend');

console.log('ok — summarizeBudget: totals, chronological rows, best-month-by-spend');
