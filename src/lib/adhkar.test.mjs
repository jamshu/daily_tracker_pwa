import test from 'node:test';
import assert from 'node:assert/strict';
import { PRAYER_LIBRARY, ADHKAR } from './adhkar.js';

test('PRAYER_LIBRARY lists the three collections with complete display data', () => {
	assert.deepEqual(
		PRAYER_LIBRARY.map((e) => e.id),
		['afterSalah', 'janaza', 'recitations']
	);
	for (const e of PRAYER_LIBRARY) {
		assert.ok(e.title.length, `${e.id} has a title`);
		assert.ok(e.subtitle.length, `${e.id} has a subtitle`);
		assert.ok(Array.isArray(e.icon) && e.icon.length, `${e.id} has icon path(s)`);
		assert.ok(e.href.startsWith('/'), `${e.id} href is app-relative`);
	}
});

test('reader-based library entries have a matching ADHKAR set', () => {
	for (const e of PRAYER_LIBRARY) {
		const m = e.href.match(/^\/adhkar\/(.+)$/);
		if (m) assert.ok(ADHKAR[m[1]], `ADHKAR has set '${m[1]}'`);
	}
});
