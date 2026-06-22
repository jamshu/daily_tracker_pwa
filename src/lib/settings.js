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

// { activities: { exercise, books, quran }, theme } — effective settings used everywhere.
export const settings = writable({ activities: defaultTargets(), theme: initialTheme() });

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

export async function loadSettings() {
	if (!browser) return;
	try {
		const res = await fetch(`${base}/api/settings`);
		if (!res.ok) return;
		const d = await res.json();
		const theme = coerceTheme(d?.settings?.theme);
		settings.set({ activities: coerce(d?.settings?.activities), theme });
		applyTheme(theme);
	} catch {
		/* keep defaults */
	}
}

export async function saveSettings({ activities, theme }) {
	const res = await fetch(`${base}/api/settings`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ activities, theme })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Could not save settings');
	const savedTheme = coerceTheme(d?.settings?.theme ?? theme);
	settings.set({ activities: coerce(d?.settings?.activities ?? activities), theme: savedTheme });
	applyTheme(savedTheme);
}
