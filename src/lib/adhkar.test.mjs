import test from 'node:test';
import assert from 'node:assert/strict';
import { PRAYER_LIBRARY, ADHKAR } from './adhkar.js';

test('PRAYER_LIBRARY lists the three collections with complete display data', () => {
	assert.deepEqual(
		PRAYER_LIBRARY.map((e) => e.id),
		['afterSalah', 'janaza', 'recitations', 'umrah']
	);
	for (const e of PRAYER_LIBRARY) {
		assert.ok(e.title.length, `${e.id} has a title`);
		assert.ok(e.subtitle.length, `${e.id} has a subtitle`);
		assert.ok(Array.isArray(e.icon) && e.icon.length, `${e.id} has icon path(s)`);
		assert.ok(!!e.href !== !!e.modal, `${e.id} has exactly one of href/modal`);
		if (e.href) assert.ok(e.href.startsWith('/'), `${e.id} href is app-relative`);
	}
});

test('janaza opens as a modal, keeping its male/female duas view', () => {
	const janaza = PRAYER_LIBRARY.find((e) => e.id === 'janaza');
	assert.equal(janaza.modal, 'janaza');
});

test('umrah guide walks the rites in order with Arabic on every step', () => {
	const items = ADHKAR.umrah.items;
	assert.ok(items.length >= 8, 'covers the rites from ihram to halq');
	for (const [i, it] of items.entries()) {
		assert.ok(it.ar.length, `step ${i + 1} has Arabic`);
		assert.ok(it.en.length, `step ${i + 1} has instructions`);
		assert.ok(it.count.startsWith(`Step ${i + 1}`), `step ${i + 1} is labelled in order`);
	}
});

test('reader- and modal-based library entries have a matching ADHKAR set', () => {
	for (const e of PRAYER_LIBRARY) {
		const m = e.href?.match(/^\/adhkar\/(.+)$/);
		if (m) assert.ok(ADHKAR[m[1]], `ADHKAR has set '${m[1]}'`);
		if (e.modal) assert.ok(ADHKAR[e.modal], `ADHKAR has set '${e.modal}'`);
	}
});
