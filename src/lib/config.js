// Habit definitions. Edit targets here — the dashboard and progress math read
// straight from these arrays, so adding/removing an item needs no other change.

/** The five daily prayers. Each is tracked for Jamath (congregation) + Sunnah. */
export const PRAYERS = [
	{ id: 'fajr', name: 'Fajr', sunnah: '2 rakʻah before' },
	{ id: 'dhuhr', name: 'Dhuhr', sunnah: '4 before · 2 after' },
	{ id: 'asr', name: 'Asr', sunnah: '4 before' },
	{ id: 'maghrib', name: 'Maghrib', sunnah: '2 after' },
	{ id: 'isha', name: 'Isha', sunnah: '2 after · Witr' }
];

/** Target-based activities. value counts toward `target` in `unit`. */
export const ACTIVITIES = [
	{ id: 'exercise', name: 'Exercise', unit: 'min', target: 30, step: 5 },
	{ id: 'books', name: 'Read Books', unit: 'min', target: 20, step: 5 },
	{ id: 'quran', name: 'Read Qurʻan', unit: 'pages', target: 5, step: 1 }
];

/** Simple done / not-done daily deeds (one mark each). */
export const DEEDS = [
	{ id: 'adhkar_morning', name: 'Morning Adhkār', hint: 'After Fajr' },
	{ id: 'adhkar_evening', name: 'Evening Adhkār', hint: 'After Asr / Maghrib' },
	{ id: 'sadaqah', name: 'Sadaqah', hint: 'Charity given' }
];

/**
 * Total weight of a perfect day, used to scale the progress bar.
 * Prayers: 2 booleans each (Jamath + Sunnah). Activities: 1 each (fraction of
 * target). Deeds: 1 boolean each.
 */
export const MAX_SCORE = PRAYERS.length * 2 + ACTIVITIES.length + DEEDS.length;

/** A fresh, empty record for one day. */
export function emptyDay() {
	const prayers = {};
	for (const p of PRAYERS) prayers[p.id] = { jamath: false, sunnah: false };
	const activities = {};
	for (const a of ACTIVITIES) activities[a.id] = 0;
	const deeds = {};
	for (const d of DEEDS) deeds[d.id] = false;
	return { prayers, activities, deeds };
}

/** Score a single day in [0, 1]. */
export function dayProgress(day) {
	if (!day) return 0;
	let score = 0;
	for (const p of PRAYERS) {
		const rec = day.prayers?.[p.id];
		if (rec?.jamath) score += 1;
		if (rec?.sunnah) score += 1;
	}
	for (const a of ACTIVITIES) {
		const v = Number(day.activities?.[a.id] || 0);
		score += Math.min(v / a.target, 1);
	}
	for (const d of DEEDS) {
		if (day.deeds?.[d.id]) score += 1;
	}
	return Math.max(0, Math.min(score / MAX_SCORE, 1));
}
