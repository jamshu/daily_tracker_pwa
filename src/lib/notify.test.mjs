import test from 'node:test';
import assert from 'node:assert/strict';
import { dueToFire } from './notify.js';

const at = (h, m) => {
	const d = new Date(2026, 6, 16, h, m, 0, 0); // local time, arbitrary date
	return d;
};

test('dueToFire — before the reminder time → false', () => {
	assert.equal(dueToFire(at(20, 59), '21:00', null, '2026-07-16'), false);
});

test('dueToFire — at/after the time, not shown today → true', () => {
	assert.equal(dueToFire(at(21, 0), '21:00', null, '2026-07-16'), true);
	assert.equal(dueToFire(at(23, 30), '21:00', '2026-07-15', '2026-07-16'), true);
});

test('dueToFire — already shown today → false', () => {
	assert.equal(dueToFire(at(22, 0), '21:00', '2026-07-16', '2026-07-16'), false);
});

test('dueToFire — no time set or malformed → false', () => {
	assert.equal(dueToFire(at(22, 0), null, null, '2026-07-16'), false);
	assert.equal(dueToFire(at(22, 0), '9pm', null, '2026-07-16'), false);
});
