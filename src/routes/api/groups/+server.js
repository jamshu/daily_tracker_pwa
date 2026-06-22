// Private groups: list my groups + pending invites (GET); create / invite /
// respond / leave / remove (POST). Invites are owner-only; a user joins only by
// accepting (status pending -> active). All ops use the admin key, so each action
// re-checks ownership / identity here before mutating.
import { json } from '@sveltejs/kit';
import { assertConfigured, adminExecute } from '$lib/server/odoo.js';
import { requireUid } from '$lib/server/auth.js';
import { clearSessionCookie } from '$lib/server/session.js';
import { m2oId, m2oName, GROUP_MODEL, MEMBER_MODEL } from '$lib/server/leaderboard.js';

export const prerender = false;

async function groupOwner(gid) {
	const g = await adminExecute(GROUP_MODEL, 'read', [[gid]], { fields: ['x_studio_owner_id'] });
	if (!g?.length) return null;
	return m2oId(g[0].x_studio_owner_id);
}

export async function GET({ cookies }) {
	try {
		assertConfigured();
		const me = await requireUid(cookies);

		// My active memberships -> the groups I belong to.
		const mine = await adminExecute(
			MEMBER_MODEL,
			'search_read',
			[
				[
					['x_studio_user_id', '=', me],
					['x_studio_status', '=', 'active']
				]
			],
			{ fields: ['x_studio_group_id'] }
		);
		const groupIds = [...new Set(mine.map((m) => m2oId(m.x_studio_group_id)).filter(Boolean))];

		let groups = [];
		if (groupIds.length) {
			const grows = await adminExecute(GROUP_MODEL, 'search_read', [[['id', 'in', groupIds]]], {
				fields: ['id', 'x_name', 'x_studio_owner_id']
			});
			const actives = await adminExecute(
				MEMBER_MODEL,
				'search_read',
				[
					[
						['x_studio_group_id', 'in', groupIds],
						['x_studio_status', '=', 'active']
					]
				],
				{ fields: ['x_studio_group_id'] }
			);
			const counts = {};
			for (const m of actives) {
				const g = m2oId(m.x_studio_group_id);
				counts[g] = (counts[g] || 0) + 1;
			}
			groups = grows.map((g) => ({
				id: g.id,
				name: g.x_name,
				isOwner: m2oId(g.x_studio_owner_id) === me,
				memberCount: counts[g.id] || 0
			}));
		}

		// Pending invites addressed to me = my in-app notifications.
		const pend = await adminExecute(
			MEMBER_MODEL,
			'search_read',
			[
				[
					['x_studio_user_id', '=', me],
					['x_studio_status', '=', 'pending']
				]
			],
			{ fields: ['id', 'x_studio_group_id', 'x_studio_invited_by_id'] }
		);
		const invites = pend.map((p) => ({
			memberId: p.id,
			groupName: m2oName(p.x_studio_group_id),
			invitedByName: m2oName(p.x_studio_invited_by_id)
		}));

		return json({ ok: true, groups, invites });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not load groups' }, { status });
	}
}

export async function POST({ request, cookies }) {
	try {
		assertConfigured();
		const me = await requireUid(cookies);
		const body = await request.json();
		const action = body?.action;

		if (action === 'create') {
			const name = String(body?.name || '').trim();
			if (name.length < 1 || name.length > 60)
				return json({ ok: false, error: 'Group name must be 1–60 characters' }, { status: 400 });
			const gid = await adminExecute(GROUP_MODEL, 'create', [
				{ x_name: name, x_studio_owner_id: me }
			]);
			await adminExecute(MEMBER_MODEL, 'create', [
				{
					x_name: name,
					x_studio_group_id: gid,
					x_studio_user_id: me,
					x_studio_invited_by_id: me,
					x_studio_status: 'active'
				}
			]);
			return json({ ok: true, id: gid });
		}

		if (action === 'invite') {
			const gid = Number(body?.groupId);
			const userId = Number(body?.userId);
			if (!Number.isInteger(gid) || !Number.isInteger(userId))
				return json({ ok: false, error: 'Bad request' }, { status: 400 });
			if ((await groupOwner(gid)) !== me)
				return json({ ok: false, error: 'Only the owner can invite' }, { status: 403 });
			// One row per (group, user) regardless of status.
			const existing = await adminExecute(
				MEMBER_MODEL,
				'search_count',
				[
					[
						['x_studio_group_id', '=', gid],
						['x_studio_user_id', '=', userId]
					]
				]
			);
			if (existing) return json({ ok: false, error: 'Already invited or a member' }, { status: 409 });
			// x_name is required on x_lb_member — derive it from the group name.
			const grp = await adminExecute(GROUP_MODEL, 'read', [[gid]], { fields: ['x_name'] });
			const gName = grp?.[0]?.x_name || 'Group';
			await adminExecute(MEMBER_MODEL, 'create', [
				{
					x_name: `${gName} / invite`,
					x_studio_group_id: gid,
					x_studio_user_id: userId,
					x_studio_invited_by_id: me,
					x_studio_status: 'pending'
				}
			]);
			return json({ ok: true });
		}

		if (action === 'respond') {
			const memberId = Number(body?.memberId);
			const accept = body?.accept === true;
			if (!Number.isInteger(memberId))
				return json({ ok: false, error: 'Bad request' }, { status: 400 });
			const rows = await adminExecute(MEMBER_MODEL, 'read', [[memberId]], {
				fields: ['x_studio_user_id', 'x_studio_status']
			});
			const row = rows?.[0];
			if (!row || m2oId(row.x_studio_user_id) !== me)
				return json({ ok: false, error: 'Not your invite' }, { status: 403 });
			if (accept) await adminExecute(MEMBER_MODEL, 'write', [[memberId], { x_studio_status: 'active' }]);
			else await adminExecute(MEMBER_MODEL, 'unlink', [[memberId]]);
			return json({ ok: true });
		}

		if (action === 'leave') {
			const gid = Number(body?.groupId);
			if (!Number.isInteger(gid))
				return json({ ok: false, error: 'Bad request' }, { status: 400 });
			if ((await groupOwner(gid)) === me) {
				// Owner leaving deletes the whole group + all member rows.
				const all = await adminExecute(MEMBER_MODEL, 'search', [[['x_studio_group_id', '=', gid]]]);
				if (all.length) await adminExecute(MEMBER_MODEL, 'unlink', [all]);
				await adminExecute(GROUP_MODEL, 'unlink', [[gid]]);
				return json({ ok: true, deleted: true });
			}
			const mine = await adminExecute(MEMBER_MODEL, 'search', [
				[
					['x_studio_group_id', '=', gid],
					['x_studio_user_id', '=', me]
				]
			]);
			if (mine.length) await adminExecute(MEMBER_MODEL, 'unlink', [mine]);
			return json({ ok: true });
		}

		if (action === 'remove') {
			const memberId = Number(body?.memberId);
			if (!Number.isInteger(memberId))
				return json({ ok: false, error: 'Bad request' }, { status: 400 });
			const rows = await adminExecute(MEMBER_MODEL, 'read', [[memberId]], {
				fields: ['x_studio_group_id', 'x_studio_user_id']
			});
			const row = rows?.[0];
			if (!row) return json({ ok: false, error: 'Not found' }, { status: 404 });
			const gid = m2oId(row.x_studio_group_id);
			if ((await groupOwner(gid)) !== me)
				return json({ ok: false, error: 'Only the owner can remove' }, { status: 403 });
			if (m2oId(row.x_studio_user_id) === me)
				return json({ ok: false, error: 'Owner cannot remove self; leave instead' }, { status: 400 });
			await adminExecute(MEMBER_MODEL, 'unlink', [[memberId]]);
			return json({ ok: true });
		}

		return json({ ok: false, error: 'Invalid action' }, { status: 400 });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not update group' }, { status });
	}
}
