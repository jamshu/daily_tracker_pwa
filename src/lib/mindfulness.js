// Mindfulness tasbih counter — data + per-day localStorage persistence.
//
// Counts live in the browser only, under the key `mindfulness:<YYYY-MM-DD>`
// holding { [dhikrId]: count }. Because the key is the day, reading on a new
// day finds nothing and every count starts at 0 — an implicit daily reset, no
// cron needed. `dateKey()` is shared with the rest of the app (store.js) so
// "today" always agrees.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { dateKey } from './store.js';

// The five dhikr, each its own full-screen breathing screen. `hue` (HSL hue,
// 0–360) drives that screen's accent gradient.
export const DHIKR = [
	{
		id: 'astaghfirullah',
		ar: 'أَسْتَغْفِرُ اللَّهَ',
		tr: 'Astaghfirullāh',
		en: 'I seek the forgiveness of Allah.',
		hue: 265,
		target: 100
	},
	{
		id: 'subhanallah',
		ar: 'سُبْحَانَ اللَّهِ',
		tr: 'Subhānallāh',
		en: 'Glory be to Allah.',
		hue: 190,
		target: 33
	},
	{
		id: 'alhamdulillah',
		ar: 'الْحَمْدُ لِلَّهِ',
		tr: 'Alhamdulillāh',
		en: 'All praise is due to Allah.',
		hue: 145,
		target: 33
	},
	{
		id: 'allahuakbar',
		ar: 'اللَّهُ أَكْبَرُ',
		tr: 'Allāhu Akbar',
		en: 'Allah is the Greatest.',
		hue: 25,
		target: 33
	},
	{
		id: 'subhanallahwabihamdihi',
		ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
		tr: 'Subhānallāhi wa bihamdih',
		en: 'Glory and praise be to Allah.',
		hue: 330,
		target: 100
	}
];

const storageKey = () => `mindfulness:${dateKey()}`;

function read() {
	if (!browser) return {};
	try {
		return JSON.parse(localStorage.getItem(storageKey()) || '{}') || {};
	} catch {
		return {};
	}
}

function write(map) {
	if (!browser) return;
	try {
		localStorage.setItem(storageKey(), JSON.stringify(map));
	} catch {
		// storage full / disabled — counts stay in the in-memory store only
	}
}

/** Reactive map of today's counts: { [dhikrId]: count }. */
export const counts = writable({});

/** Load today's counts from localStorage into the store (call on mount). */
export function loadCounts() {
	counts.set(read());
}

/** Increment one dhikr's count, persist, and buzz (haptic) if supported. */
export function increment(id) {
	counts.update((m) => {
		const next = { ...m, [id]: (m[id] || 0) + 1 };
		write(next);
		return next;
	});
	if (browser) navigator.vibrate?.(15);
}

/** Reset one dhikr's count to 0. */
export function reset(id) {
	counts.update((m) => {
		const next = { ...m, [id]: 0 };
		write(next);
		return next;
	});
}
