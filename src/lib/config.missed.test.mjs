// Runnable check: the `missed` flag round-trips and never leaks into scoring.
// Run: node src/lib/config.missed.test.mjs
import assert from 'node:assert';
import { emptyDay, parseDay, dayProgress, ACTIVITIES } from './config.js';

const a = ACTIVITIES[0].id;

// 1. round-trip: missed survives parseDay, only truthy entries kept
const day = emptyDay();
day.missed[a] = true;
day.missed['junk'] = false;
const round = parseDay(JSON.stringify(day));
assert.strictEqual(round.missed[a], true, 'missed flag lost on round-trip');
assert.ok(!('junk' in round.missed), 'falsy missed entries should be dropped');

// 2. a missed activity (value 0 + flag) scores exactly like a plain value-0 day
const missedDay = emptyDay();
missedDay.activities[a] = 0;
missedDay.missed[a] = true;
const zeroDay = emptyDay();
const pMissed = dayProgress(missedDay, null, 'male');
const pZero = dayProgress(zeroDay, null, 'male');
assert.ok(Number.isFinite(pMissed) && pMissed >= 0, 'progress must be finite & non-negative');
assert.strictEqual(pMissed, pZero, 'missed must score identically to value 0');

// 3. old records without a `missed` key parse to an empty missed map
const legacy = parseDay(JSON.stringify({ activities: { [a]: 3 } }));
assert.deepStrictEqual(legacy.missed, {}, 'legacy record should get empty missed map');

console.log('ok — missed flag round-trips and never touches scoring');
