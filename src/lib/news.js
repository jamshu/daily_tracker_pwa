import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';

/** { articles: [], loaded: bool, error: string|null } */
export const news = writable({ articles: [], loaded: false, error: null });

let started = false;

export async function loadNews() {
	if (!browser || started) return;
	started = true;
	try {
		const res = await fetch(`${base}/api/news`);
		const body = await res.json();
		if (!body.success) throw new Error(body.error || 'Could not load news');
		news.set({ articles: body.articles || [], loaded: true, error: null });
	} catch (e) {
		started = false;
		news.set({ articles: [], loaded: true, error: e?.message || 'Could not load news' });
	}
}

/** Format ISO / RFC-2822 pubDate → relative string ("2 h ago", "Yesterday", etc.) */
export function relativeTime(pubDate) {
	if (!pubDate) return '';
	const d = new Date(pubDate);
	if (isNaN(d)) return '';
	const diff = Date.now() - d.getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins} min ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs} h ago`;
	const days = Math.floor(hrs / 24);
	if (days === 1) return 'Yesterday';
	return `${days} d ago`;
}
