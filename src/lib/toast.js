import { writable } from 'svelte/store';

export const toast = writable(null); // { id, points } | { id, message }

let timer;

export function celebrate(field, points = 4) {
	toast.set({ id: Date.now() + Math.random(), points });
	clearTimeout(timer);
	timer = setTimeout(() => toast.set(null), 1000);
}

// Random motivation shown when a tasbeeh / dhikr set reaches its target —
// a message instead of a +score.
const CHEERS = [
	'Allāhu Akbar! 🌙',
	'Mā shāʼ Allāh!',
	'Set complete — beautifully done.',
	'May Allah accept it. 🤲',
	'Keep the remembrance alive. ✨',
	'Your heart shines with dhikr.',
	'Bārakallāhu fīk!',
	'The angels record your praise. 🌟',
	'SubḥānAllāh — keep going!',
	'One more set for the Hereafter.'
];

export function congratulate(message) {
	const text = message || CHEERS[Math.floor(Math.random() * CHEERS.length)];
	toast.set({ id: Date.now() + Math.random(), message: text });
	clearTimeout(timer);
	timer = setTimeout(() => toast.set(null), 2300);
}

export function dismissToast() {
	clearTimeout(timer);
	toast.set(null);
}
