// Celebration toast store. `celebrate(field)` picks a random appreciation +
// reward for the act and shows it; it auto-dismisses after a few seconds.
import { writable } from 'svelte/store';
import { REWARDS } from './rewards.js';

export const toast = writable(null); // { id, field, title, quote, source }

let timer;

export function celebrate(field) {
	const pool = REWARDS[field];
	if (!pool || !pool.length) return;
	const pick = pool[Math.floor(Math.random() * pool.length)];
	toast.set({ id: Date.now() + Math.random(), field, ...pick });
	clearTimeout(timer);
	timer = setTimeout(() => toast.set(null), 5200);
}

export function dismissToast() {
	clearTimeout(timer);
	toast.set(null);
}
