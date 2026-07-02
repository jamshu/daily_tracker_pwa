// Pure aggregation for the Report route. Takes parsed day records and produces
// per-prayer attendance counts and per-activity days-completed. Completion uses
// each day's `targets` snapshot (not current settings) so lowering a goal later
// doesn't retroactively inflate past days. Kept pure/testable (report.test.mjs).
import { PRAYERS, ACTIVITIES } from './config.js';

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

	const stdTarget = (a, day) =>
		day.targets?.[a.id] ?? settings.activities?.[a.id] ?? a.target;

	for (const { data: day } of days) {
		for (const p of PRAYERS) {
			const r = day.prayers?.[p.id];
			if (!r) { prayers[p.id].missed++; continue; }
			if (r.jamath) prayers[p.id].jamath++;
			else if (r.home) prayers[p.id].home++;
			else if (r.late) prayers[p.id].late++;
			else prayers[p.id].missed++;
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
	}

	return { totalDays, prayers, activities };
}

/** Percentage helper for the prayer bars. */
export const pct = (count, total) => (total ? Math.round((count / total) * 100) : 0);
