// Per-user settings. Defaults come from config.js; saved overrides live in
// on-device storage (localdb).
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { ACTIVITIES } from './config.js';
import { coerceTheme, DEFAULT_THEME } from './themes.js';
import * as localdb from './localdb.js';

function defaultTargets() {
	const t = {};
	for (const a of ACTIVITIES) t[a.id] = a.target;
	return t;
}

export function coerceSex(v) {
	return v === 'female' ? 'female' : 'male';
}

// User's display name — trimmed, capped, empty string when unset/invalid.
export function coerceName(v) {
	return typeof v === 'string' ? v.trim().slice(0, 40) : '';
}

// Reminder time is "HH:MM" or null (off).
export function coerceReminder(v) {
	return typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : null;
}

// Start from the cached theme (same value the app.html pre-paint script used)
// so hydration doesn't flash back to the default before loadSettings returns.
function initialTheme() {
	if (browser) {
		try {
			return coerceTheme(localStorage.getItem('theme'));
		} catch {
			/* ignore */
		}
	}
	return DEFAULT_THEME;
}

// { activities, theme, sex, showNotes, reminderTime } — effective settings.
export const settings = writable({
	activities: defaultTargets(),
	theme: initialTheme(),
	sex: 'male',
	name: '',
	showNotes: false,
	reminderTime: '21:00'
});

// Apply a theme to <html> immediately and cache it for pre-paint (app.html).
export function applyTheme(id) {
	if (!browser) return;
	const t = coerceTheme(id);
	document.documentElement.dataset.theme = t;
	try {
		localStorage.setItem('theme', t);
	} catch {
		/* ignore */
	}
}

function coerce(obj) {
	const out = {};
	for (const a of ACTIVITIES) {
		const n = Number(obj?.[a.id]);
		out[a.id] = Number.isFinite(n) && n > 0 ? Math.round(n) : a.target; // fall back to default
	}
	return out;
}

function fromRaw(d) {
	const theme = coerceTheme(d?.theme);
	return {
		activities: coerce(d?.activities),
		theme,
		sex: coerceSex(d?.sex),
		name: coerceName(d?.name),
		showNotes: d?.showNotes === true,
		// absent key (pre-existing installs / first run) keeps the 21:00 default
		reminderTime: 'reminderTime' in (d || {}) ? coerceReminder(d.reminderTime) : '21:00'
	};
}

export async function loadSettings() {
	if (!browser) return;
	const d = localdb.getSettings();
	if (!d) return; // first run — keep defaults
	const s = fromRaw(d);
	settings.set(s);
	applyTheme(s.theme);
}

export async function saveSettings(patch) {
	let cur;
	settings.update((v) => (cur = v));
	const s = fromRaw({ ...cur, ...patch });
	localdb.setSettings(s);
	settings.set(s);
	applyTheme(s.theme);
}
