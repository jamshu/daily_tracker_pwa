// Persistent tally counters — reactive store over the localdb collection.
// Mirrors mindfulness.js: a writable store plus thin wrappers that mutate
// localdb then refresh the store so the page stays reactive. Call
// loadCounters() on mount (after localdb.init(), which the layout awaits).
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import * as localdb from './localdb.js';

/** Reactive list of counters: [{ id, name, count, goal }]. */
export const counters = writable([]);

export function loadCounters() {
	counters.set([...localdb.listCounters()]);
}

export function addCounter(props) {
	const id = localdb.addCounter(props);
	loadCounters();
	return id;
}

export function increment(id) {
	localdb.incrementCounter(id);
	loadCounters();
	if (browser) navigator.vibrate?.(15);
}

export function setValue(id, n) {
	localdb.setCounterValue(id, n);
	loadCounters();
}

export function setGoal(id, goal) {
	localdb.setCounterGoal(id, goal);
	loadCounters();
}

export function reset(id) {
	localdb.resetCounter(id);
	loadCounters();
}

export function rename(id, name) {
	localdb.renameCounter(id, name);
	loadCounters();
}

export function remove(id) {
	localdb.deleteCounter(id);
	loadCounters();
}
