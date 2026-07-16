// Custom activities: definitions live in localdb (on-device), per-day logged
// values live in the day record (store.js, keyed by `act_<id>`). This module
// holds the client-side stores + the modal flow state.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { congratulate } from './toast.js';
import * as localdb from './localdb.js';

/** User's own activities: [{ id, name, emoji, category, goal: { value, unit } | null }] */
export const userActivities = writable([]);
/** Preset catalog: [{ id, name, emoji, category, goal: { value, unit } | null }] */
export const presets = writable([]);
/** Units available to pick: [{ id, name }] (globals + user's custom) */
export const units = writable([]);

/** Modal view: null | 'picker' | 'create' | 'goal' | 'edit-goal' */
export const activityModal = writable(null);
/** In-progress custom activity being created in the modal. */
export const draft = writable({ name: '', emoji: '', goal: null }); // goal: { value, unitId, unitName }
/** Activity whose goal is being edited: { id, name, goal: { value, unit, unitId } | null } | null */
export const editingActivity = writable(null);

export function openActivityModal() {
	draft.set({ name: '', emoji: '', goal: null });
	activityModal.set('picker');
}
export function openGoalEditor(activity) {
	editingActivity.set(activity);
	activityModal.set('edit-goal');
}
export function closeActivityModal() {
	activityModal.set(null);
	editingActivity.set(null);
}

export async function loadActivities() {
	if (!browser) return;
	const d = localdb.listActivities();
	userActivities.set(d.activities ?? []);
	presets.set(d.presets ?? []);
}

export async function loadUnits() {
	if (!browser) return;
	units.set(localdb.listUnits() ?? []);
}

export async function addFromPreset(presetId) {
	localdb.addFromPreset(presetId);
	await loadActivities();
	congratulate('Activity added');
}

/** draft: { name, emoji, goal: { value, unitId } | null } */
export async function addCustom(d) {
	localdb.addCustomActivity({
		name: d.name,
		emoji: d.emoji || '',
		goal: d.goal ? { value: d.goal.value, unitId: d.goal.unitId ?? null } : null
	});
	await loadActivities();
	congratulate('Activity added');
}

/** goal: { value, unitId } | null (null removes the goal → boolean activity). */
export async function setActivityGoal(id, goal) {
	localdb.setActivityGoal(id, goal ? { value: goal.value, unitId: goal.unitId } : null);
	await loadActivities();
	congratulate(goal ? 'Goal updated' : 'Goal removed');
}

export async function deleteActivity(id) {
	try {
		localdb.deleteActivity(id);
		await loadActivities();
	} catch (e) {
		console.error('[activities] delete failed:', e?.message);
		congratulate('Could not remove — try again');
	}
}

/** Create a custom unit, refresh the list, return the new { id, name }. */
export async function createUnit(name) {
	const unit = localdb.createUnit(name);
	await loadUnits();
	return unit;
}
