// Runnable check: prayer Late/Missed scoring. Late adds exactly 1, Missed adds 0,
// MAX_SCORE is unchanged. Run: node src/lib/config.prayer.test.mjs
import assert from 'node:assert';
import { emptyDay, dayProgress, WEIGHTS, MAX_SCORE, PRAYERS } from './config.js';

const p = PRAYERS[0].id; // fajr

// baseline: empty day scores 0
assert.strictEqual(dayProgress(emptyDay(), null, 'male'), 0, 'empty day should be 0');

// Late on one prayer → exactly WEIGHTS.late / MAX_SCORE
const lateDay = emptyDay();
lateDay.prayers[p].late = true;
assert.strictEqual(WEIGHTS.late, 1, 'late weight should be 1');
assert.ok(
	Math.abs(dayProgress(lateDay, null, 'male') - WEIGHTS.late / MAX_SCORE) < 1e-9,
	'late must add exactly 1 point'
);

// Missed scores 0 (same as empty)
const missedDay = emptyDay();
missedDay.prayers[p].missed = true;
assert.strictEqual(dayProgress(missedDay, null, 'male'), 0, 'missed must add 0');

// Jamath still 8; late < jamath (attendance slot unchanged max)
const jamDay = emptyDay();
jamDay.prayers[p].jamath = true;
assert.ok(
	Math.abs(dayProgress(jamDay, null, 'male') - WEIGHTS.jamath / MAX_SCORE) < 1e-9,
	'jamath must add 8'
);

// MAX_SCORE unchanged by adding late/missed to the attendance slot
assert.strictEqual(MAX_SCORE, 92, 'MAX_SCORE should remain 92');

console.log('ok — late=+1, missed=+0, MAX_SCORE=92 unchanged');
