// Odoo-backed data layer. Each day is one `x_dailytracker` record:
//   x_studio_date    -> the day (YYYY-MM-DD), our key
//   x_studio_json    -> JSON of { prayers, activities, deeds }
//   x_studio_notes   -> HTML notes
//   x_studio_journal -> HTML journal
//   x_name           -> display name
//
// The UI edits an in-memory copy immediately (optimistic) and we debounce a
// create/update back to Odoo per date. Reads/writes go through the /api/odoo
// proxy (src/lib/odoo.js) — credentials never reach the browser.
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { emptyDay, dayProgress } from './config.js';
import { odooClient } from './odoo.js';
import { user } from './auth.js';

const FIELDS = [
	'id',
	'x_studio_date',
	'x_studio_json',
	'x_studio_notes',
	'x_studio_journal',
	'create_uid'
];
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

// Notes & Journal are rich text (HTML) from the editor and are stored verbatim
// in the Odoo HTML fields — no plain-text conversion.

/* -------------------------------- records -------------------------------- */
// record shape: { id: number|null, data: {prayers,activities,deeds}, notes, journal }

function blankRecord() {
	return { id: null, data: emptyDay(), notes: '', journal: '' };
}

function parseData(jsonStr) {
	const base = emptyDay();
	if (!jsonStr) return base;
	try {
		const o = JSON.parse(jsonStr);
		if (o.prayers)
			for (const id in base.prayers)
				if (o.prayers[id])
					base.prayers[id] = {
							jamath: !!o.prayers[id].jamath,
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
export const currentProgress = derived(currentDay, ($d) => dayProgress($d));
export const currentNotes = derived(currentRecord, ($r) => $r.notes);
export const currentJournal = derived(currentRecord, ($r) => $r.journal);

/* --------------------------------- load ---------------------------------- */

export async function load() {
	if (!browser) return;
	syncState.set('loading');
	try {
		const today = dateKey();
		const start = shiftKey(today, -(RANGE_DAYS - 1));
		const rows = await odooClient.searchRecords(
			[
				['x_studio_date', '>=', start],
				['x_studio_date', '<=', today]
			],
			FIELDS
		);
		const map = {};
		const myUid = get(user)?.uid;
		for (const row of rows) {
			const k = row.x_studio_date;
			if (!k) continue;
			// Secondary client-side guard: keep only records I created. The Odoo
			// record rule (['create_uid','=',user.id]) is the real enforcement —
			// this just avoids ever showing someone else's row if a rule is missing.
			if (myUid != null && row.create_uid) {
				const owner = Array.isArray(row.create_uid) ? row.create_uid[0] : row.create_uid;
				if (owner !== myUid) continue;
			}
			map[k] = {
				id: row.id,
				data: parseData(row.x_studio_json),
				notes: row.x_studio_notes || '',
				journal: row.x_studio_journal || ''
			};
		}
		// merge so any unsaved local edits made before load finished survive
		records.update((cur) => ({ ...map, ...cur }));
		syncState.set('idle');
	} catch (e) {
		syncState.set('error');
		syncError.set(e?.message || 'Could not load from Odoo');
	}
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
	const fields = {
		x_name: `Daily Tracker ${date}`,
		x_studio_date: date,
		x_studio_json: JSON.stringify(rec.data),
		x_studio_notes: rec.notes || '',
		x_studio_journal: rec.journal || ''
	};
	try {
		if (rec.id) {
			await odooClient.updateRecord(rec.id, fields);
		} else {
			const id = await odooClient.createRecord(fields);
			records.update((m) => ({ ...m, [date]: { ...m[date], id } }));
		}
		syncState.set('saved');
		setTimeout(() => {
			if (get(syncState) === 'saved') syncState.set('idle');
		}, 1500);
	} catch (e) {
		syncState.set('error');
		syncError.set(e?.message || 'Could not save to Odoo');
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

export function togglePrayer(date, prayerId, field) {
	mutate(date, (r) => {
		if (!r.data.prayers[prayerId]) r.data.prayers[prayerId] = { jamath: false, sunnah: false };
		r.data.prayers[prayerId][field] = !r.data.prayers[prayerId][field];
	});
}

export function setActivity(date, activityId, value) {
	mutate(date, (r) => {
		r.data.activities[activityId] = Math.max(0, Math.round(value));
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

export function setJournal(date, text) {
	records.update((m) => {
		const cur = m[date] ? { ...m[date] } : blankRecord();
		cur.journal = text;
		return { ...m, [date]: cur };
	});
	scheduleSave(date);
}
