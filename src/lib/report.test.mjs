// Runnable check: report aggregation — prayer counts/percent + activity
// completion honouring the per-day `targets` snapshot and `act_<id>` keying.
// Run: node src/lib/report.test.mjs
import assert from 'node:assert';
import { emptyDay, ACTIVITIES } from './config.js';
import { aggregate, pct } from './report.js';

const ex = ACTIVITIES[0].id; // exercise (default target 30)

// Day 1: fajr jamath; exercise 30 met against snapshot target 30.
const d1 = emptyDay();
d1.prayers.fajr.jamath = true;
d1.activities[ex] = 30;
d1.targets[ex] = 30;

// Day 2: fajr late; exercise 12 met against snapshot target 10 (goal was lower that day).
const d2 = emptyDay();
d2.prayers.fajr.late = true;
d2.activities[ex] = 12;
d2.targets[ex] = 10;

// Day 3: fajr missed; a goal-based additional activity act_7 hits its goal.
const d3 = emptyDay();
d3.prayers.fajr.missed = true;
d3.customActivities['act_7'] = 5;
d3.targets['act_7'] = 5;

const days = [d1, d2, d3].map((data, i) => ({ date: `2026-07-0${i + 1}`, data }));
const userActivities = [{ id: 7, name: 'Read Hadith', goal: { value: 5, unit: 'Times' } }];

// Aggregate with a CURRENT exercise target of 30 — day 2 (value 12) must still
// count as completed because its snapshot was 10. This is the whole point.
const r = aggregate(days, { userActivities, settings: { activities: { [ex]: 30 } } });

assert.strictEqual(r.totalDays, 3);
assert.deepStrictEqual(r.prayers.fajr, { jamath: 1, home: 0, late: 1, missed: 1 }, 'fajr counts');
assert.strictEqual(pct(1, 3), 33, 'percent helper');
assert.strictEqual(r.activities[ex].completed, 2, 'exercise completed honours snapshot (day2 counts)');
assert.strictEqual(r.activities[ex].total, 3, 'exercise total = all days');
assert.strictEqual(r.activities['act_7'].completed, 1, 'additional act_7 goal met once');
assert.strictEqual(r.activities['act_7'].additional, true, 'additional flag');

console.log('ok — report aggregation: prayer counts + snapshot-based completion');
