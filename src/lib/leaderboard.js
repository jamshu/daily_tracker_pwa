// Client-side leaderboard reads. Global board + a single group's board.
import { writable } from 'svelte/store';
import { base } from '$app/paths';

export const global = writable(null); // { rows, shareGlobal, myRank } | null
export const globalState = writable('idle'); // 'idle' | 'loading' | 'error'

const url = (p) => `${base}${p}`;

export async function loadGlobal() {
	globalState.set('loading');
	try {
		const res = await fetch(url('/api/leaderboard'));
		const d = await res.json();
		if (!res.ok || !d.ok) throw new Error(d.error || 'Failed');
		global.set({ rows: d.rows || [], shareGlobal: d.shareGlobal === true, myRank: d.myRank ?? null });
		globalState.set('idle');
	} catch {
		globalState.set('error');
	}
}

/** Returns { name, isOwner, rows, members } or throws (403 when not a member). */
export async function loadGroupBoard(id) {
	const res = await fetch(url(`/api/leaderboard/${id}`));
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) {
		const e = new Error(d.error || 'Failed');
		e.status = res.status;
		throw e;
	}
	return d;
}

export function resetLeaderboard() {
	global.set(null);
	globalState.set('idle');
}
