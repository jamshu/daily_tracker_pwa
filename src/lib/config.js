// Habit definitions. Edit targets here — the dashboard and progress math read
// straight from these arrays, so adding/removing an item needs no other change.

/**
 * The five daily prayers. Each tracks Jamāʻah (congregation) + Dhikr after
 * salah; most also track a Sunnah — Asr has no Sunnah, so hasSunnah is false.
 */
export const PRAYERS = [
	{ id: 'fajr', name: 'Fajr', hasSunnah: true, sunnah: '2 rakʻah before' },
	{ id: 'dhuhr', name: 'Dhuhr', hasSunnah: true, sunnah: '4 before · 2 after' },
	{ id: 'asr', name: 'Asr', hasSunnah: false, sunnah: '' },
	{ id: 'maghrib', name: 'Maghrib', hasSunnah: true, sunnah: '2 after' },
	{ id: 'isha', name: 'Isha', hasSunnah: true, sunnah: '2 after · Witr' }
];

/** Marks available across all prayers: Jamāʻah + Dhikr each, + Sunnah where it applies. */
export const PRAYER_MARKS = PRAYERS.reduce((n, p) => n + 2 + (p.hasSunnah ? 1 : 0), 0);

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
 * Prayers: Jamāʻah + Dhikr each, plus Sunnah where it applies (PRAYER_MARKS).
 * Activities: 1 each (fraction of target). Deeds: 1 boolean each.
 */
export const MAX_SCORE = PRAYER_MARKS + ACTIVITIES.length + DEEDS.length;

/** A fresh, empty record for one day. */
export function emptyDay() {
	const prayers = {};
	for (const p of PRAYERS) prayers[p.id] = { jamath: false, sunnah: false, dhikr: false };
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
		if (p.hasSunnah && rec?.sunnah) score += 1;
		if (rec?.dhikr) score += 1;
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
