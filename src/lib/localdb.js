// Fully local data layer — replaces the Odoo backend. One JSON blob holds
// everything; bill images live in separate files so the debounced whole-blob
// rewrite stays KB-sized.
//   Native (Capacitor): Filesystem Directory.Data (never evicted, backed up)
//   Web/dev:            localStorage
// API shapes mirror the old /api/* responses (Odoo x_ field names kept) so the
// existing pages/stores work unchanged.
import { browser } from '$app/environment';

const DB_FILE = 'dailytracker-db.json';
const LS_KEY = 'dtl_db';
const PERSIST_MS = 300;

// Preset activity catalog + built-in units (formerly Odoo x_activities/x_units).
export const PRESETS = [
	{ id: 101, name: 'Sunnan Al-Rawatib', emoji: '🕌', category: 'Prayers', goal: null },
	{ id: 102, name: 'Duha', emoji: '🌞', category: 'Prayers', goal: null },
	{ id: 103, name: 'Taraweeh', emoji: '', category: 'Prayers', goal: null },
	{ id: 201, name: 'Mondays & Thursdays', emoji: '🌙', category: 'Fasting', goal: null },
	{ id: 202, name: 'White days fasting', emoji: '', category: 'Fasting', goal: null },
	{ id: 301, name: 'Listen Quran', emoji: '🎧', category: 'Learning & dawah', goal: { value: 10, unit: 'Minutes', unitId: 2 } }
];
const DEFAULT_UNITS = [
	{ id: 1, name: 'Times' },
	{ id: 2, name: 'Minutes' },
	{ id: 3, name: 'Hours' },
	{ id: 4, name: 'Verses' }
];

function emptyDb() {
	return {
		version: 1,
		seq: 1000, // custom ids start above preset/unit ids
		days: {}, // dateKey -> { data, notes }
		settings: null,
		activities: [],
		counters: [], // [{ id, name, count, goal, linkActivity }] — persistent tally counters
		countersSeeded: false, // one-time seed of the two default Quran counters
		units: DEFAULT_UNITS,
		budget: {}, // { 'YYYY-MM': { catId: { budget, actual, ... } } }
		expenses: [], // rows with Odoo x_ field names
		tags: [], // [{ id, x_name }]
		todos: [] // [{ id, x_name, x_studio_due_date, x_studio_done }]
	};
}

let db = emptyDb();
let isNative = false;
let Filesystem, Directory, Encoding;
let persistTimer = null;
let initDone = false;

/* ------------------------------ persistence ------------------------------ */

export async function init() {
	if (!browser || initDone) return;
	initDone = true;
	const { Capacitor } = await import('@capacitor/core');
	isNative = Capacitor.isNativePlatform();
	let raw = null;
	if (isNative) {
		({ Filesystem, Directory, Encoding } = await import('@capacitor/filesystem'));
		try {
			raw = (await Filesystem.readFile({ path: DB_FILE, directory: Directory.Data, encoding: Encoding.UTF8 })).data;
		} catch {
			/* first run — no file yet */
		}
		const { App } = await import('@capacitor/app');
		App.addListener('pause', flushNow);
	} else {
		raw = localStorage.getItem(LS_KEY);
	}
	if (raw) {
		try {
			db = { ...emptyDb(), ...JSON.parse(raw) };
		} catch {
			/* corrupt — start fresh rather than crash */
		}
	}
	if (!db.countersSeeded) {
		db.counters.push(
			{ id: nextId(), name: 'Quran Pages', count: 0, goal: null, linkActivity: 'quran' },
			{ id: nextId(), name: 'Memorize Quran', count: 0, goal: null, linkActivity: 'memorize' }
		);
		db.countersSeeded = true;
		persist();
	}
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') flushNow();
	});
}

async function writeDb() {
	const raw = JSON.stringify(db);
	if (isNative) {
		await Filesystem.writeFile({ path: DB_FILE, directory: Directory.Data, data: raw, encoding: Encoding.UTF8 });
	} else {
		localStorage.setItem(LS_KEY, raw);
	}
}

function persist() {
	clearTimeout(persistTimer);
	persistTimer = setTimeout(() => writeDb().catch((e) => console.error('[localdb] persist failed:', e)), PERSIST_MS);
}

export function flushNow() {
	clearTimeout(persistTimer);
	writeDb().catch((e) => console.error('[localdb] flush failed:', e));
}

export function nextId() {
	db.seq += 1;
	persist();
	return db.seq;
}

/* ---------------------------------- days --------------------------------- */

/** All days as { dateKey: { data, notes } } (raw objects, caller parses). */
export function getDays() {
	return db.days;
}

export function putDay(date, { data, notes }) {
	db.days[date] = { data, notes: notes || '' };
	persist();
}

/* -------------------------------- settings ------------------------------- */

export function getSettings() {
	return db.settings;
}

export function setSettings(obj) {
	db.settings = obj;
	persist();
}

/* ------------------------------- activities ------------------------------ */

const unitName = (unitId) => db.units.find((u) => u.id === unitId)?.name || '';

export function listActivities() {
	return { activities: db.activities, presets: PRESETS };
}

export function addFromPreset(presetId) {
	const p = PRESETS.find((x) => x.id === Number(presetId));
	if (!p) throw new Error('Preset not found');
	const id = nextId();
	db.activities.push({ ...p, id, goal: p.goal ? { ...p.goal } : null });
	persist();
	return id;
}

/** goal: { value, unitId } | null */
export function addCustomActivity({ name, emoji, goal }) {
	const id = nextId();
	db.activities.push({
		id,
		name: String(name || '').trim().slice(0, 60),
		emoji: String(emoji || '').trim().slice(0, 16),
		category: 'Other',
		goal:
			goal && Number(goal.value) > 0 && goal.unitId
				? { value: Math.round(goal.value), unit: unitName(Number(goal.unitId)), unitId: Number(goal.unitId) }
				: null
	});
	persist();
	return id;
}

export function setActivityGoal(id, goal) {
	const a = db.activities.find((x) => x.id === Number(id));
	if (!a) throw new Error('Activity not found');
	a.goal = goal
		? { value: Math.round(goal.value), unit: unitName(Number(goal.unitId)), unitId: Number(goal.unitId) }
		: null;
	persist();
}

export function deleteActivity(id) {
	db.activities = db.activities.filter((x) => x.id !== Number(id));
	persist();
}

export function listUnits() {
	return db.units;
}

export function createUnit(name) {
	const clean = String(name || '').trim().slice(0, 20);
	if (!clean) throw new Error('name required');
	const existing = db.units.find((u) => u.name.toLowerCase() === clean.toLowerCase());
	if (existing) return existing;
	const unit = { id: nextId(), name: clean };
	db.units.push(unit);
	persist();
	return unit;
}

/* -------------------------------- counters ------------------------------- */
// Persistent named tally counters (e.g. "Quran pages read"). Unlike the
// mindfulness dhikr counter these never auto-reset — value holds until the user
// resets it. Backed up/exported for free via the `...db` spread.

const coerceGoal = (g) => (Number(g) > 0 ? Math.round(Number(g)) : null);

export function listCounters() {
	return db.counters;
}

export function addCounter({ name, goal, linkActivity } = {}) {
	const id = nextId();
	db.counters.push({
		id,
		name: String(name || '').trim().slice(0, 60) || 'Counter',
		count: 0,
		goal: coerceGoal(goal),
		linkActivity: linkActivity || null
	});
	persist();
	return id;
}

/** Apply `delta` to every counter linked to `activityId` (from daily-activity edits). */
export function adjustLinkedCounters(activityId, delta) {
	if (!delta) return;
	let changed = false;
	for (const c of db.counters) {
		if (c.linkActivity === activityId) {
			c.count = Math.max(0, c.count + delta);
			changed = true;
		}
	}
	if (changed) persist();
}

function findCounter(id) {
	const c = db.counters.find((x) => x.id === Number(id));
	if (!c) throw new Error('Counter not found');
	return c;
}

export function incrementCounter(id) {
	const c = findCounter(id);
	c.count += 1;
	persist();
	return c.count;
}

export function setCounterValue(id, n) {
	const c = findCounter(id);
	c.count = Math.max(0, Math.round(Number(n) || 0));
	persist();
	return c.count;
}

export function setCounterGoal(id, goal) {
	findCounter(id).goal = coerceGoal(goal);
	persist();
}

export function resetCounter(id) {
	findCounter(id).count = 0;
	persist();
}

export function renameCounter(id, name) {
	findCounter(id).name = String(name || '').trim().slice(0, 60) || 'Counter';
	persist();
}

export function deleteCounter(id) {
	db.counters = db.counters.filter((x) => x.id !== Number(id));
	persist();
}

/* --------------------------------- budget -------------------------------- */

export function getBudget() {
	return db.budget;
}

export function setBudget(monthsMap) {
	db.budget = monthsMap;
	persist();
}

/* -------------------------------- expenses ------------------------------- */

// Sum (category, month) and denormalize into the budget blob's `actual`,
// exactly like the old server did — budget/report pages need no changes.
function recomputeActual(category, month) {
	const sum = db.expenses.reduce(
		(s, r) =>
			r.x_studio_category === category && String(r.x_studio_date).slice(0, 7) === month
				? s + (r.x_studio_amount || 0)
				: s,
		0
	);
	const actual = Math.round(sum * 100) / 100;
	db.budget[month] = { ...db.budget[month], [category]: { ...db.budget[month]?.[category], actual } };
	persist();
	return actual;
}

function sanitizeExpense(body) {
	const category = String(body.category || '').trim().slice(0, 50);
	if (!category) throw new Error('Category required');
	const date = String(body.date || '').trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date');
	const amount = Math.round((Number(body.amount) || 0) * 100) / 100;
	if (amount <= 0) throw new Error('Amount must be positive');
	const vals = {
		x_name: String(body.description || '').trim().slice(0, 120) || category,
		x_studio_date: date,
		x_studio_category: category,
		x_studio_amount: amount
	};
	if (Array.isArray(body.tagIds)) {
		vals.x_studio_tag_ids = body.tagIds.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 20);
	}
	return { vals, category, month: date.slice(0, 7) };
}

export function listExpenses({ month, from, to } = {}) {
	let rows;
	if (from && to) {
		rows = db.expenses.filter((r) => r.x_studio_date >= from && r.x_studio_date <= to);
	} else {
		rows = db.expenses.filter((r) => String(r.x_studio_date).slice(0, 7) === month);
	}
	rows = [...rows].sort((a, b) =>
		a.x_studio_date === b.x_studio_date ? b.id - a.id : a.x_studio_date < b.x_studio_date ? 1 : -1
	);
	return { expenses: rows, tags: db.tags };
}

export async function addExpense(body) {
	const { vals, category, month } = sanitizeExpense(body);
	const id = nextId();
	if (body.image) {
		await putBill(id, body.image);
		vals.x_studio_bill_filename = String(body.filename || 'bill.jpg').slice(0, 80);
	}
	db.expenses.push({ id, ...vals });
	const actual = recomputeActual(category, month);
	return { id, actual, month, category };
}

export async function updateExpense(id, body) {
	const row = db.expenses.find((r) => r.id === Number(id));
	if (!row) throw new Error('Not found');
	const { vals, category, month } = sanitizeExpense(body);
	const oldCat = row.x_studio_category;
	const oldMonth = String(row.x_studio_date).slice(0, 7);
	if ('image' in body) {
		if (body.image) {
			await putBill(row.id, body.image);
			vals.x_studio_bill_filename = String(body.filename || 'bill.jpg').slice(0, 80);
		} else {
			await deleteBill(row.id);
			vals.x_studio_bill_filename = false;
		}
	}
	Object.assign(row, vals);
	const actual = recomputeActual(category, month);
	if (oldCat && (oldCat !== category || oldMonth !== month)) recomputeActual(oldCat, oldMonth);
	return { id: row.id, actual, month, category };
}

export async function deleteExpense(id) {
	const row = db.expenses.find((r) => r.id === Number(id));
	if (!row) throw new Error('Not found');
	const category = row.x_studio_category;
	const month = String(row.x_studio_date).slice(0, 7);
	db.expenses = db.expenses.filter((r) => r.id !== row.id);
	await deleteBill(row.id).catch(() => {});
	const actual = category ? recomputeActual(category, month) : 0;
	return { actual, month, category };
}

export function addTag(name) {
	const clean = String(name || '').trim().slice(0, 40);
	if (!clean) throw new Error('Tag name required');
	const existing = db.tags.find((t) => t.x_name.toLowerCase() === clean.toLowerCase());
	if (existing) return existing;
	const tag = { id: nextId(), x_name: clean };
	db.tags.push(tag);
	persist();
	return tag;
}

/* ------------------------------ bill images ------------------------------ */
// Stored outside the main blob: file per bill on native, own LS key on web.

const billPath = (id) => `bill-${id}.txt`;

export async function putBill(id, b64) {
	if (isNative) {
		await Filesystem.writeFile({ path: billPath(id), directory: Directory.Data, data: b64, encoding: Encoding.UTF8 });
	} else {
		localStorage.setItem(`dtl_bill_${id}`, b64);
	}
}

export async function getBill(id) {
	if (isNative) {
		try {
			return (await Filesystem.readFile({ path: billPath(id), directory: Directory.Data, encoding: Encoding.UTF8 })).data;
		} catch {
			return null;
		}
	}
	return localStorage.getItem(`dtl_bill_${id}`);
}

export async function deleteBill(id) {
	if (isNative) {
		await Filesystem.deleteFile({ path: billPath(id), directory: Directory.Data }).catch(() => {});
	} else {
		localStorage.removeItem(`dtl_bill_${id}`);
	}
}

/* ---------------------------------- todos -------------------------------- */

export function listTodos() {
	return [...db.todos].sort((a, b) => {
		if (a.x_studio_done !== b.x_studio_done) return a.x_studio_done ? 1 : -1;
		return String(a.x_studio_due_date || '9999') < String(b.x_studio_due_date || '9999') ? -1 : 1;
	});
}

export function addTodo(title, date) {
	const clean = String(title || '').trim().slice(0, 60);
	if (!clean) throw new Error('Title required');
	if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date');
	const id = nextId();
	db.todos.push({ id, x_name: clean, x_studio_due_date: date || false, x_studio_done: false });
	persist();
	return id;
}

export function toggleTodo(id) {
	const t = db.todos.find((x) => x.id === Number(id));
	if (!t) throw new Error('Not found');
	t.x_studio_done = !t.x_studio_done;
	persist();
	return t.x_studio_done;
}

export function deleteTodo(id) {
	db.todos = db.todos.filter((x) => x.id !== Number(id));
	persist();
}

/* ------------------------------ export/import ---------------------------- */

export async function exportJSON() {
	const bills = {};
	for (const r of db.expenses) {
		if (!r.x_studio_bill_filename) continue;
		const b64 = await getBill(r.id);
		if (b64) bills[r.id] = b64;
	}
	return JSON.stringify({ ...db, bills });
}

export async function importJSON(obj) {
	if (!obj || obj.version !== 1 || typeof obj.days !== 'object') throw new Error('Not a valid backup file');
	const { bills = {}, ...rest } = obj;
	db = { ...emptyDb(), ...rest };
	for (const [id, b64] of Object.entries(bills)) {
		if (typeof b64 === 'string' && b64) await putBill(id, b64);
	}
	await writeDb();
}
