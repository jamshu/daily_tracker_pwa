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
	{ id: 'quran', name: 'Read Qurʻan', unit: 'pages', target: 5, step: 1 },
	{ id: 'sleep', name: 'Sleep', unit: 'hours', target: 6, step: 1 }
];

/** Simple done / not-done daily deeds (one mark each). */
export const DEEDS = [
	{ id: 'adhkar_morning', name: 'Morning Adhkār', hint: 'After Fajr', guide: 'morning' },
	{ id: 'adhkar_evening', name: 'Evening Adhkār', hint: 'After Asr / Maghrib', guide: 'evening' },
	{ id: 'sadaqah', name: 'Sadaqah', hint: 'Charity given' }
];

/** Voluntary (nafl) prayers — simple done / not-done (one mark each). */
export const NAWAFIL = [
	{ id: 'tahajjud', name: 'Tahajjud', hint: 'Night prayer' },
	{ id: 'duha', name: 'Duha', hint: 'Forenoon prayer' }
];

/**
 * Total weight of a perfect day, used to scale the progress bar.
 * Prayers: Jamāʻah + Dhikr each, plus Sunnah where it applies (PRAYER_MARKS).
 * Activities: 1 each (fraction of target). Deeds + Nawafil: 1 boolean each.
 */
export const MAX_SCORE = PRAYER_MARKS + ACTIVITIES.length + DEEDS.length + NAWAFIL.length;

/** A fresh, empty record for one day. */
export function emptyDay() {
	const prayers = {};
	for (const p of PRAYERS) prayers[p.id] = { jamath: false, home: false, sunnah: false, dhikr: false };
	const activities = {};
	for (const a of ACTIVITIES) activities[a.id] = 0;
	const deeds = {};
	for (const d of DEEDS) deeds[d.id] = false;
	const nawafil = {};
	for (const n of NAWAFIL) nawafil[n.id] = false;
	return { prayers, activities, deeds, nawafil };
}

/**
 * Parse a stored x_studio_json string into a full day object (missing keys
 * filled from emptyDay()). Shared by the client store and the server-side
 * leaderboard scorer so both interpret records identically.
 */
export function parseDay(jsonStr) {
	const base = emptyDay();
	if (!jsonStr) return base;
	try {
		const o = JSON.parse(jsonStr);
		if (o.prayers)
			for (const id in base.prayers)
				if (o.prayers[id])
					base.prayers[id] = {
						jamath: !!o.prayers[id].jamath,
						home: !!o.prayers[id].home,
						sunnah: !!o.prayers[id].sunnah,
						dhikr: !!o.prayers[id].dhikr
					};
		if (o.activities)
			for (const id in base.activities)
				if (o.activities[id] != null) base.activities[id] = Number(o.activities[id]) || 0;
		if (o.deeds) for (const id in base.deeds) base.deeds[id] = !!o.deeds[id];
		if (o.nawafil) for (const id in base.nawafil) base.nawafil[id] = !!o.nawafil[id];
	} catch {
		/* malformed JSON — fall back to an empty day */
	}
	return base;
}

/**
 * Score a single day in [0, 1]. `targets` optionally overrides per-activity
 * goals (per-user settings); falls back to each activity's default target.
 * `sex` ('male' | 'female') scales the "prayed at home" attendance mark: a male
 * praying at home earns 1/5 of the Jamāʻah mark, a female earns the full mark
 * (praying at home is religiously equivalent for women). Defaults to male.
 */
export function dayProgress(day, targets, sex) {
	if (!day) return 0;
	const homeMark = sex === 'female' ? 1 : 0.2;
	let score = 0;
	for (const p of PRAYERS) {
		const rec = day.prayers?.[p.id];
		if (rec?.jamath) score += 1;
		else if (rec?.home) score += homeMark;
		if (p.hasSunnah && rec?.sunnah) score += 1;
		if (rec?.dhikr) score += 1;
	}
	for (const a of ACTIVITIES) {
		const target = (targets && targets[a.id]) || a.target;
		const v = Number(day.activities?.[a.id] || 0);
		score += Math.min(v / target, 1);
	}
	for (const d of DEEDS) {
		if (day.deeds?.[d.id]) score += 1;
	}
	for (const n of NAWAFIL) {
		if (day.nawafil?.[n.id]) score += 1;
	}
	return Math.max(0, Math.min(score / MAX_SCORE, 1));
}

/**
 * Leaderboard points for a stored day JSON string, scored against the DEFAULT
 * targets (so lowering personal targets can't inflate rank). Range [0, MAX_SCORE].
 */
export function dayPoints(jsonStr, sex) {
	return dayProgress(parseDay(jsonStr), null, sex) * MAX_SCORE;
}
