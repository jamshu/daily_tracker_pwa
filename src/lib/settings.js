// Per-user settings (currently just activity targets). Defaults come from
// config.js; the user's saved overrides are loaded from /api/settings (which
// reads x_studio_settings off their res.users record).
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';
import { ACTIVITIES } from './config.js';
import { coerceTheme, DEFAULT_THEME } from './themes.js';

function defaultTargets() {
	const t = {};
	for (const a of ACTIVITIES) t[a.id] = a.target;
	return t;
}

export function coerceSex(v) {
	return v === 'female' ? 'female' : 'male';
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

// { activities: { exercise, books, quran }, theme, shareGlobal, sex, customActivities } — effective settings.
export const settings = writable({
	activities: defaultTargets(),
	theme: initialTheme(),
	shareGlobal: false,
	sex: 'male',
	customActivities: []
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

// Reset to defaults when the user logs out, so the next user never briefly sees
// the previous user's targets before loadSettings() returns. Theme stays on the
// cached value to avoid a flash; loadSettings() applies the new user's theme.
export function resetSettings() {
	settings.set({
		activities: defaultTargets(),
		theme: initialTheme(),
		shareGlobal: false,
		sex: 'male',
		customActivities: []
	});
}

export async function loadSettings() {
	if (!browser) return;
	try {
		const res = await fetch(`${base}/api/settings`);
		if (!res.ok) return;
		const d = await res.json();
		const theme = coerceTheme(d?.settings?.theme);
		settings.set({
			activities: coerce(d?.settings?.activities),
			theme,
			shareGlobal: d?.settings?.shareGlobal === true,
			sex: coerceSex(d?.settings?.sex),
			customActivities: Array.isArray(d?.settings?.customActivities) ? d.settings.customActivities : []
		});
		applyTheme(theme);
	} catch {
		/* keep defaults */
	}
}

export async function saveSettings({ activities, theme, shareGlobal, sex, customActivities }) {
	const res = await fetch(`${base}/api/settings`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ activities, theme, shareGlobal: shareGlobal === true, sex: coerceSex(sex), customActivities: customActivities ?? [] })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Could not save settings');
	const savedTheme = coerceTheme(d?.settings?.theme ?? theme);
	settings.set({
		activities: coerce(d?.settings?.activities ?? activities),
		theme: savedTheme,
		shareGlobal: d?.settings?.shareGlobal === true,
		sex: coerceSex(d?.settings?.sex ?? sex),
		customActivities: Array.isArray(d?.settings?.customActivities) ? d.settings.customActivities : []
	});
	applyTheme(savedTheme);
}
