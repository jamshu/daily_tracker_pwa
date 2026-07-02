// Runnable check: per-day `targets` snapshot round-trips and never affects scoring.
// Run: node src/lib/config.targets.test.mjs
import assert from 'node:assert';
import { emptyDay, parseDay, dayProgress, ACTIVITIES } from './config.js';

const a = ACTIVITIES[0].id;

// 1. round-trip: only finite, positive numbers kept
const day = emptyDay();
day.targets[a] = 30;
day.targets['bad'] = 0; // dropped (not > 0)
day.targets['nan'] = 'x'; // dropped (not finite)
const round = parseDay(JSON.stringify(day));
assert.strictEqual(round.targets[a], 30, 'targets snapshot lost on round-trip');
assert.ok(!('bad' in round.targets), 'zero target should be dropped');
assert.ok(!('nan' in round.targets), 'non-numeric target should be dropped');

// 2. legacy record (no targets key) → empty targets map
const legacy = parseDay(JSON.stringify({ activities: { [a]: 3 } }));
assert.deepStrictEqual(legacy.targets, {}, 'legacy record should get empty targets map');

// 3. targets snapshot never changes dayProgress (report-only)
const withT = emptyDay();
withT.activities[a] = 3;
withT.targets[a] = 5;
const noT = emptyDay();
noT.activities[a] = 3;
assert.strictEqual(
	dayProgress(withT, null, 'male'),
	dayProgress(noT, null, 'male'),
	'targets snapshot must not affect scoring'
);

console.log('ok — targets snapshot round-trips and never touches scoring');
