// First-run welcome modal state. Mirrors the activityModal store pattern.
import { writable } from 'svelte/store';

export const welcomeOpen = writable(false);

export function openWelcome() {
	welcomeOpen.set(true);
}

export function closeWelcome() {
	welcomeOpen.set(false);
}
