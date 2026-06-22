// Client-side groups API. Talks to /api/groups, /api/users/search, and (for the
// per-group board) /api/leaderboard/[id]. The `invites` store doubles as the
// in-app notification source — its length drives the nav badge.
import { writable, derived } from 'svelte/store';
import { base } from '$app/paths';

export const myGroups = writable([]); // [{ id, name, isOwner, memberCount }]
export const invites = writable([]); // [{ memberId, groupName, invitedByName }]
export const pendingInviteCount = derived(invites, ($i) => $i.length);

const url = (p) => `${base}${p}`;

async function post(action, payload = {}) {
	const res = await fetch(url('/api/groups'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action, ...payload })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Request failed');
	return d;
}

export async function loadGroups() {
	try {
		const res = await fetch(url('/api/groups'));
		if (!res.ok) return;
		const d = await res.json();
		if (d.ok) {
			myGroups.set(d.groups || []);
			invites.set(d.invites || []);
		}
	} catch {
		/* ignore — keep current */
	}
}

export async function createGroup(name) {
	const d = await post('create', { name });
	await loadGroups();
	return d.id;
}

export async function inviteUser(groupId, userId) {
	await post('invite', { groupId, userId });
}

export async function respondInvite(memberId, accept) {
	await post('respond', { memberId, accept });
	await loadGroups();
}

export async function leaveGroup(groupId) {
	await post('leave', { groupId });
	await loadGroups();
}

export async function removeMember(memberId) {
	await post('remove', { memberId });
}

export async function searchUsers(q) {
	const res = await fetch(url(`/api/users/search?q=${encodeURIComponent(q)}`));
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Search failed');
	return d.users || [];
}

export function resetGroups() {
	myGroups.set([]);
	invites.set([]);
}
