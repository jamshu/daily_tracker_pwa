// Per-user settings (currently just activity targets). Defaults come from
// config.js; the user's saved overrides are loaded from /api/settings (which
// reads x_studio_settings off their res.users record).
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';
import { ACTIVITIES } from './config.js';

function defaultTargets() {
	const t = {};
	for (const a of ACTIVITIES) t[a.id] = a.target;
	return t;
}

// { activities: { exercise, books, quran } } — effective targets used everywhere.
export const settings = writable({ activities: defaultTargets() });

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
		settings.set({ activities: coerce(d?.settings?.activities) });
	} catch {
		/* keep defaults */
	}
}

export async function saveSettings(activities) {
	const res = await fetch(`${base}/api/settings`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ activities })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Could not save settings');
	settings.set({ activities: coerce(d?.settings?.activities ?? activities) });
}
