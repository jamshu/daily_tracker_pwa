// Local data layer. Each day is one entry in localdb:
//   dateKey (YYYY-MM-DD) -> { data: JSON of { prayers, activities, deeds }, notes: HTML }
//
// The UI edits an in-memory copy immediately (optimistic) and we debounce a
// write to on-device storage per date. Nothing leaves the phone.
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { emptyDay, dayProgress, parseDay } from './config.js';
import * as localdb from './localdb.js';
import { settings } from './settings.js';

const RANGE_DAYS = 35; // how many recent days to load for the week strip + history

/* ----------------------------- date helpers ----------------------------- */

export function dateKey(d = new Date()) {
	const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
	return local.toISOString().slice(0, 10);
}
export function shiftKey(key, n) {
	const [y, m, d] = key.split('-').map(Number);
	return dateKey(new Date(y, m - 1, d + n));
}

// Notes are rich text (HTML) from the editor and are stored verbatim —
// no plain-text conversion.

/* -------------------------------- records -------------------------------- */
// record shape: { id: number|null, data: {prayers,activities,deeds}, notes }

function blankRecord() {
	return { id: null, data: emptyDay(), notes: '' };
}

// Day-JSON parsing lives in config.js (shared with the leaderboard scorer).
const parseData = parseDay;

/** dateKey -> record */
export const records = writable({});
/** currently viewed date */
export const selectedDate = writable(dateKey());
/** 'idle' | 'loading' | 'saving' | 'saved' | 'error' */
export const syncState = writable('idle');
export const syncError = writable('');

/** Map dateKey -> day-data, for the week strip and progress. */
export const allDays = derived(records, ($r) => {
	const m = {};
	for (const k in $r) m[k] = $r[k].data;
	return m;
});

const currentRecord = derived([records, selectedDate], ([$r, $d]) => $r[$d] || blankRecord());
export const currentDay = derived(currentRecord, ($r) => $r.data);
export const currentProgress = derived([currentDay, settings], ([$d, $s]) =>
	dayProgress($d, $s.activities, $s.sex)
);
export const currentNotes = derived(currentRecord, ($r) => $r.notes);

/* --------------------------------- load ---------------------------------- */

export async function load() {
	if (!browser) return;
	syncState.set('loading');
	try {
		const today = dateKey();
		const start = shiftKey(today, -(RANGE_DAYS - 1));
		const days = localdb.getDays();
		const map = {};
		for (const k in days) {
			if (k < start || k > today) continue;
			map[k] = { id: null, data: parseData(days[k].data), notes: days[k].notes || '' };
		}
		// merge so any unsaved local edits made before load finished survive
		records.update((cur) => ({ ...map, ...cur }));
		syncState.set('idle');
	} catch (e) {
		syncState.set('error');
		syncError.set(e?.message || 'Could not load data');
	}
}

/**
 * Fetch parsed day records for a date range (for the Report — separate from the
 * 35-day `records` feed). `start` omitted = all-time (no lower bound).
 * Returns [{ date, data }] parsed via parseDay. Best-effort; throws on failure.
 */
export async function loadReportRange(start, end) {
	const days = localdb.getDays();
	const out = [];
	for (const k in days) {
		if (k > end || (start && k < start)) continue;
		out.push({ date: k, data: parseData(days[k].data) });
	}
	return out;
}

/* -------------------------------- saving --------------------------------- */

const timers = {}; // dateKey -> debounce timer
const chains = {}; // dateKey -> promise chain (serialise saves per date)

function scheduleSave(date) {
	clearTimeout(timers[date]);
	syncState.set('saving');
	timers[date] = setTimeout(() => {
		const prev = chains[date] || Promise.resolve();
		chains[date] = prev.then(() => doSave(date)).catch(() => {});
	}, 700);
}

async function doSave(date) {
	const rec = get(records)[date];
	if (!rec) return;
	try {
		localdb.putDay(date, { data: JSON.stringify(rec.data), notes: rec.notes || '' });
		syncState.set('saved');
		setTimeout(() => {
			if (get(syncState) === 'saved') syncState.set('idle');
		}, 1500);
	} catch (e) {
		syncState.set('error');
		syncError.set(e?.message || 'Could not save');
	}
}

/* ------------------------------- mutations ------------------------------- */

function mutate(date, fn) {
	records.update((m) => {
		const cur = m[date]
			? { ...m[date], data: structuredClone(m[date].data) }
			: blankRecord();
		fn(cur);
		return { ...m, [date]: cur };
	});
	scheduleSave(date);
}

// Attendance is a single choice per prayer — exactly one of these (or none).
const ATTENDANCE = ['jamath', 'home', 'late', 'missed'];

export function togglePrayer(date, prayerId, field) {
	mutate(date, (r) => {
		if (!r.data.prayers[prayerId])
			r.data.prayers[prayerId] = { jamath: false, home: false, late: false, missed: false, sunnah: false, dhikr: false };
		const rec = r.data.prayers[prayerId];
		rec[field] = !rec[field];
		// Attendance states are mutually exclusive — turning one on clears the rest.
		if (rec[field] && ATTENDANCE.includes(field)) {
			for (const f of ATTENDANCE) if (f !== field) rec[f] = false;
		}
	});
}

// `target` is the goal that applied when this was logged; snapshotted per day so
// future reports judge completion against the then-current target (see parseDay).
function snapshotTarget(r, id, target) {
	if (target == null) return;
	if (!r.data.targets) r.data.targets = {};
	r.data.targets[id] = target;
}

export function setActivity(date, activityId, value, target = null) {
	const prev = Number(get(records)[date]?.data?.activities?.[activityId] ?? 0);
	const next = Math.max(0, Math.round(value));
	mutate(date, (r) => {
		r.data.activities[activityId] = next;
		if (r.data.missed) delete r.data.missed[activityId]; // any value clears "missed"
		snapshotTarget(r, activityId, target);
	});
	// Linked counters follow the daily activity by its delta (cumulative lifetime total).
	localdb.adjustLinkedCounters(activityId, next - prev);
}

export function setCustomActivity(date, id, value, target = null) {
	const prev = Number(get(records)[date]?.data?.customActivities?.[id] ?? 0);
	const next = Math.max(0, Math.round(value));
	mutate(date, (r) => {
		if (!r.data.customActivities) r.data.customActivities = {};
		r.data.customActivities[id] = next;
		if (r.data.missed) delete r.data.missed[id];
		snapshotTarget(r, id, target);
	});
	localdb.adjustLinkedCounters(id, next - prev);
}

/** Mark an activity (standard or custom) as intentionally missed: value 0 + red flag. */
export function markMissed(date, id, isCustom = false, target = null) {
	mutate(date, (r) => {
		if (!r.data.missed) r.data.missed = {};
		r.data.missed[id] = true;
		if (isCustom) {
			if (!r.data.customActivities) r.data.customActivities = {};
			r.data.customActivities[id] = 0;
		} else {
			r.data.activities[id] = 0;
		}
		snapshotTarget(r, id, target);
	});
}

export function toggleDeed(date, deedId) {
	mutate(date, (r) => {
		if (!r.data.deeds) r.data.deeds = {};
		r.data.deeds[deedId] = !r.data.deeds[deedId];
	});
}

/** Toggle a voluntary prayer (Tahajjud, Duha) for a date. */
export function toggleNafl(date, naflId) {
	mutate(date, (r) => {
		if (!r.data.nawafil) r.data.nawafil = {};
		r.data.nawafil[naflId] = !r.data.nawafil[naflId];
	});
}

export function setNotes(date, text) {
	records.update((m) => {
		const cur = m[date] ? { ...m[date] } : blankRecord();
		cur.notes = text;
		return { ...m, [date]: cur };
	});
	scheduleSave(date);
}

/* -------------------------------- reset ---------------------------------- */

// Wipe all in-memory data (used after a backup import, before reload).
export function resetData() {
	for (const k in timers) clearTimeout(timers[k]);
	for (const k in timers) delete timers[k];
	for (const k in chains) delete chains[k];
	records.set({});
	selectedDate.set(dateKey());
	syncState.set('idle');
	syncError.set('');
}
