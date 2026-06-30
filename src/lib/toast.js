import { writable } from 'svelte/store';

export const toast = writable(null); // { id, points }

let timer;

export function celebrate(field, points = 4) {
	toast.set({ id: Date.now() + Math.random(), points });
	clearTimeout(timer);
	timer = setTimeout(() => toast.set(null), 1000);
}

export function dismissToast() {
	clearTimeout(timer);
	toast.set(null);
}
