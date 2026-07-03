// Habit definitions. Edit targets here — the dashboard and progress math read
// straight from these arrays, so adding/removing an item needs no other change.

/**
 * The five daily prayers. Each tracks Jamāʻah (congregation) + Dhikr after
 * salah; most also track a Sunnah — Asr has no Sunnah, so hasSunnah is false.
 */
export const PRAYERS = [
	{ id: 'fajr', name: 'Fajr', emoji: '🌅', hasSunnah: true, sunnah: '2 rakʻah before' },
	{ id: 'dhuhr', name: 'Dhuhr', emoji: '☀️', hasSunnah: true, sunnah: '4 before · 2 after' },
	{ id: 'asr', name: 'Asr', emoji: '🌤️', hasSunnah: false, sunnah: '' },
	{ id: 'maghrib', name: 'Maghrib', emoji: '🌇', hasSunnah: true, sunnah: '2 after' },
	{ id: 'isha', name: 'Isha', emoji: '🌙', hasSunnah: true, sunnah: '2 after' }
];

/** Marks available across all prayers: Jamāʻah + Dhikr each, + Sunnah where it applies. */
export const PRAYER_MARKS = PRAYERS.reduce((n, p) => n + 2 + (p.hasSunnah ? 1 : 0), 0);

/**
 * Point weights — each act's contribution to the daily score. Jamāʻah is the
 * heaviest act; home (praying alone) is a fraction of it for men and equal for
 * women. Activities earn their weight proportionally up to target.
 */
export const WEIGHTS = {
	jamath: 8,
	homeMale: 2,
	homeFemale: 8,
	late: 1, // prayed late — partial credit in the attendance slot (missed = 0)
	sunnah: 2,
	dhikr: 2,
	deed: 4,
	nafl: 4,
	activity: 2 // default — an activity's own `weight` (see ACTIVITIES) takes precedence
};

/**
 * Target-based activities. value counts toward `target` in `unit`.
 * `weight` overrides WEIGHTS.activity — Qurʻan acts count double.
 */
export const ACTIVITIES = [
	{ id: 'exercise', name: 'Exercise', emoji: '🏃', unit: 'min', target: 30, step: 5, weight: 2 },
	{ id: 'quran', name: 'Read Qurʻan', emoji: '📖', unit: 'pages', target: 5, step: 1, weight: 4 },
	{ id: 'memorize', name: 'Memorize Qurʻan', emoji: '🧠', unit: 'verses', target: 5, step: 1, weight: 4 }
];

/** Simple done / not-done daily deeds (one mark each). */
export const DEEDS = [
	{ id: 'adhkar_morning', name: 'Morning Adhkār', emoji: '🌄', hint: 'After Fajr', guide: 'morning' },
	{ id: 'adhkar_evening', name: 'Evening Adhkār', emoji: '🌆', hint: 'After Asr / Maghrib', guide: 'evening' },
	{ id: 'sadaqah', name: 'Sadaqah', emoji: '🤲', hint: 'Charity given' }
];

/** Voluntary (nafl) prayers — simple done / not-done (one mark each). */
export const NAWAFIL = [
	{ id: 'tahajjud', name: 'Tahajjud', emoji: '🌌', hint: 'Night prayer' },
	{ id: 'duha', name: 'Duha', emoji: '🌞', hint: 'Forenoon prayer' },
	{ id: 'witr', name: 'Witr', emoji: '✨', hint: 'After Isha' }
];

/**
 * Total points for a perfect day, used to scale the progress bar.
 * Sum of every act's WEIGHT: prayers (jamath + dhikr each, + sunnah where it
 * applies), activities, deeds, and nawafil.
 */
const PRAYER_POINTS = PRAYERS.reduce(
	(n, p) => n + WEIGHTS.jamath + WEIGHTS.dhikr + (p.hasSunnah ? WEIGHTS.sunnah : 0),
	0
);
export const MAX_SCORE =
	PRAYER_POINTS +
	ACTIVITIES.reduce((n, a) => n + (a.weight ?? WEIGHTS.activity), 0) +
	DEEDS.length * WEIGHTS.deed +
	NAWAFIL.length * WEIGHTS.nafl;

/** A fresh, empty record for one day. */
export function emptyDay() {
	const prayers = {};
	for (const p of PRAYERS) prayers[p.id] = { jamath: false, home: false, late: false, missed: false, sunnah: false, dhikr: false };
	const activities = {};
	for (const a of ACTIVITIES) activities[a.id] = 0;
	const deeds = {};
	for (const d of DEEDS) deeds[d.id] = false;
	const nawafil = {};
	for (const n of NAWAFIL) nawafil[n.id] = false;
	return { prayers, activities, deeds, nawafil, customActivities: {}, missed: {}, targets: {} };
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
						late: !!o.prayers[id].late,
						missed: !!o.prayers[id].missed,
						sunnah: !!o.prayers[id].sunnah,
						dhikr: !!o.prayers[id].dhikr
					};
		if (o.activities)
			for (const id in base.activities)
				if (o.activities[id] != null) base.activities[id] = Number(o.activities[id]) || 0;
		if (o.deeds) for (const id in base.deeds) base.deeds[id] = !!o.deeds[id];
		if (o.nawafil) for (const id in base.nawafil) base.nawafil[id] = !!o.nawafil[id];
		if (o.customActivities && typeof o.customActivities === 'object' && !Array.isArray(o.customActivities)) {
			for (const [id, v] of Object.entries(o.customActivities)) {
				// New custom activities are keyed by `act_<odooId>` (see src/lib/activities.js).
				// Legacy `ca_*` values are dropped (definitions moved to Odoo).
				if (/^act_\d+$/.test(id)) base.customActivities[id] = Math.max(0, Number(v) || 0);
			}
		}
		// `missed`: intentionally-not-done flag (UI red state). A missed activity
		// has value 0, which already scores 0 — this never touches dayProgress.
		if (o.missed && typeof o.missed === 'object' && !Array.isArray(o.missed)) {
			for (const [id, v] of Object.entries(o.missed)) if (v) base.missed[id] = true;
		}
		// `targets`: snapshot of each activity's goal on the day it was logged, so
		// later reports judge completion against the target that applied then (not
		// current settings). Report-only — never used by dayProgress.
		if (o.targets && typeof o.targets === 'object' && !Array.isArray(o.targets)) {
			for (const [id, v] of Object.entries(o.targets)) {
				const n = Number(v);
				if (Number.isFinite(n) && n > 0) base.targets[id] = n;
			}
		}
	} catch {
		/* malformed JSON — fall back to an empty day */
	}
	return base;
}

/**
 * Score a single day in [0, 1]. `targets` optionally overrides per-activity
 * goals (per-user settings); falls back to each activity's default target.
 * `sex` ('male' | 'female') scales the "prayed at home" attendance mark: a male
 * praying at home earns WEIGHTS.homeMale, a female earns the full Jamāʻah weight
 * (praying at home is religiously equivalent for women). Defaults to male.
 */
export function dayProgress(day, targets, sex) {
	if (!day) return 0;
	const homeMark = sex === 'female' ? WEIGHTS.homeFemale : WEIGHTS.homeMale;
	let score = 0;
	for (const p of PRAYERS) {
		const rec = day.prayers?.[p.id];
		if (rec?.jamath) score += WEIGHTS.jamath;
		else if (rec?.home) score += homeMark;
		else if (rec?.late) score += WEIGHTS.late; // missed → 0
		if (p.hasSunnah && rec?.sunnah) score += WEIGHTS.sunnah;
		if (rec?.dhikr) score += WEIGHTS.dhikr;
	}
	for (const a of ACTIVITIES) {
		const target = (targets && targets[a.id]) || a.target;
		const v = Number(day.activities?.[a.id] || 0);
		score += Math.min(v / target, 1) * (a.weight ?? WEIGHTS.activity);
	}
	for (const d of DEEDS) {
		if (day.deeds?.[d.id]) score += WEIGHTS.deed;
	}
	for (const n of NAWAFIL) {
		if (day.nawafil?.[n.id]) score += WEIGHTS.nafl;
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
