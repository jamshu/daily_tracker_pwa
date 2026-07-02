// Pure aggregation for the Report route. Takes parsed day records and produces
// per-prayer attendance counts and per-activity days-completed. Completion uses
// each day's `targets` snapshot (not current settings) so lowering a goal later
// doesn't retroactively inflate past days. Kept pure/testable (report.test.mjs).
import { PRAYERS, ACTIVITIES, DEEDS, NAWAFIL, dayProgress } from './config.js';

/**
 * @param days  [{ date, data }] parsed via parseDay
 * @param opts  { userActivities: [{id,name,goal}], settings: { activities } }
 * @returns { totalDays, prayers: {id:{jamath,home,late,missed}}, activities: {key:{name,completed,total,additional?}} }
 */
export function aggregate(days, { userActivities = [], settings = {} } = {}) {
	const totalDays = days.length;

	const prayers = {};
	for (const p of PRAYERS) prayers[p.id] = { jamath: 0, home: 0, late: 0, missed: 0 };

	const activities = {};
	for (const a of ACTIVITIES) activities[a.id] = { name: a.name, completed: 0, total: 0 };
	for (const ua of userActivities)
		activities[`act_${ua.id}`] = { name: ua.name, completed: 0, total: 0, additional: true };

	const deeds = {};
	for (const d of DEEDS) deeds[d.id] = { name: d.name, completed: 0, total: totalDays };

	const nawafil = {};
	for (const n of NAWAFIL) nawafil[n.id] = { name: n.name, completed: 0, total: totalDays };

	const stdTarget = (a, day) =>
		day.targets?.[a.id] ?? settings.activities?.[a.id] ?? a.target;

	for (const { data: day } of days) {
		for (const p of PRAYERS) {
			const r = day.prayers?.[p.id];
			if (!r) continue;
			if (r.jamath) prayers[p.id].jamath++;
			else if (r.home) prayers[p.id].home++;
			else if (r.late) prayers[p.id].late++;
			else if (r.missed) prayers[p.id].missed++;
		}
		for (const a of ACTIVITIES) {
			const rec = activities[a.id];
			rec.total++;
			if (Number(day.activities?.[a.id] || 0) >= stdTarget(a, day)) rec.completed++;
		}
		for (const ua of userActivities) {
			const key = `act_${ua.id}`;
			const rec = activities[key];
			rec.total++;
			const v = Number(day.customActivities?.[key] ?? 0);
			const done = ua.goal ? v >= (day.targets?.[key] ?? ua.goal.value) : v >= 1;
			if (done) rec.completed++;
		}
		for (const d of DEEDS) {
			if (day.deeds?.[d.id]) deeds[d.id].completed++;
		}
		for (const n of NAWAFIL) {
			if (day.nawafil?.[n.id]) nawafil[n.id].completed++;
		}
	}

	return { totalDays, prayers, activities, deeds, nawafil };
}

/** Percentage helper for the prayer bars. */
export const pct = (count, total) => (total ? Math.round((count / total) * 100) : 0);

// Local-time YYYY-MM-DD key (mirrors store.js dateKey without importing it,
// keeping this module dependency-free and testable in plain node).
const keyOf = (d) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateOf = (key) => {
	const [y, m, d] = key.split('-').map(Number);
	return new Date(y, m - 1, d);
};

/**
 * Headline stats for the report tiles. Scores each day with dayProgress()
 * (honouring the per-day `targets` snapshot, falling back to settings).
 * - streak: consecutive calendar days with score > 0 ending today (or yesterday
 *   if today isn't scored yet); an untracked day breaks it.
 * - bestDay: { date, score } of the highest-scoring day (null if none scored).
 * - perfectDays: days with a full score.
 * `today` is injectable for tests.
 *
 * @param days [{ date: 'YYYY-MM-DD', data }] parsed via parseDay
 */
export function summarize(days, { settings = {}, today = keyOf(new Date()) } = {}) {
	const scoreByDate = new Map();
	for (const { date, data } of days) {
		const targets = { ...(settings.activities || {}), ...(data.targets || {}) };
		scoreByDate.set(date, dayProgress(data, targets, settings.sex));
	}

	let bestDay = null;
	let perfectDays = 0;
	for (const [date, score] of scoreByDate) {
		if (score >= 1) perfectDays++;
		if (score > 0 && (!bestDay || score > bestDay.score)) bestDay = { date, score };
	}

	let streak = 0;
	const cursor = dateOf(today);
	if (!((scoreByDate.get(today) ?? 0) > 0)) cursor.setDate(cursor.getDate() - 1);
	while ((scoreByDate.get(keyOf(cursor)) ?? 0) > 0) {
		streak++;
		cursor.setDate(cursor.getDate() - 1);
	}

	return { streak, bestDay, perfectDays };
}
