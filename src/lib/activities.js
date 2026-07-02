// Custom activities: definitions live in Odoo (x_activities / x_goals / x_units),
// per-day logged values live in the day record (store.js, keyed by `act_<id>`).
// This module holds the client-side stores + the modal flow state and talks to
// the /api/activities and /api/units endpoints.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';
import { congratulate } from './toast.js';

/** User's own activities: [{ id, name, emoji, category, goal: { value, unit } | null }] */
export const userActivities = writable([]);
/** Preset catalog: [{ id, name, emoji, category, goal: { value, unit } | null }] */
export const presets = writable([]);
/** Units available to pick: [{ id, name }] (globals + user's custom) */
export const units = writable([]);

/** Modal view: null | 'picker' | 'create' | 'goal' */
export const activityModal = writable(null);
/** In-progress custom activity being created in the modal. */
export const draft = writable({ name: '', emoji: '', goal: null }); // goal: { value, unitId, unitName }

export function openActivityModal() {
	draft.set({ name: '', emoji: '', goal: null });
	activityModal.set('picker');
}
export function closeActivityModal() {
	activityModal.set(null);
}

async function api(path, opts) {
	const res = await fetch(`${base}${path}`, opts);
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || `HTTP ${res.status}`);
	return d;
}

const jsonPost = (body) => ({
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(body)
});

export async function loadActivities() {
	if (!browser) return;
	try {
		const d = await api('/api/activities', {});
		userActivities.set(d.activities ?? []);
		presets.set(d.presets ?? []);
	} catch (e) {
		console.error('[activities] load failed:', e?.message);
	}
}

export async function loadUnits() {
	if (!browser) return;
	try {
		const d = await api('/api/units', {});
		units.set(d.units ?? []);
	} catch (e) {
		console.error('[units] load failed:', e?.message);
	}
}

export async function addFromPreset(presetId) {
	await api('/api/activities', jsonPost({ action: 'add-from-preset', presetId }));
	await loadActivities();
	congratulate('Activity added');
}

/** draft: { name, emoji, goal: { value, unitId } | null } */
export async function addCustom(d) {
	await api(
		'/api/activities',
		jsonPost({
			action: 'add-custom',
			name: d.name,
			emoji: d.emoji || '',
			goal: d.goal ? { value: d.goal.value, unitId: d.goal.unitId ?? null } : null
		})
	);
	await loadActivities();
	congratulate('Activity added');
}

export async function deleteActivity(id) {
	try {
		await api('/api/activities', jsonPost({ action: 'delete', id }));
		await loadActivities();
	} catch (e) {
		console.error('[activities] delete failed:', e?.message);
		congratulate('Could not remove — try again');
	}
}

/** Create a custom unit, refresh the list, return the new { id, name }. */
export async function createUnit(name) {
	const d = await api('/api/units', jsonPost({ name }));
	await loadUnits();
	return d.unit;
}
