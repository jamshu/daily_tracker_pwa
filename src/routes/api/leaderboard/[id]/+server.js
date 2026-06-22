// Private group leaderboard. Requester MUST be an active member of the group,
// otherwise 403. Returns only ranked { name, score } for the group's members.
import { json } from '@sveltejs/kit';
import { assertConfigured, adminExecute } from '$lib/server/odoo.js';
import { requireUid } from '$lib/server/auth.js';
import { clearSessionCookie } from '$lib/server/session.js';
import {
	scoreByUser,
	rankRows,
	m2oId,
	m2oName,
	GROUP_MODEL,
	MEMBER_MODEL
} from '$lib/server/leaderboard.js';

export const prerender = false;

export async function GET({ params, cookies }) {
	try {
		assertConfigured();
		const me = await requireUid(cookies);
		const gid = Number(params.id);
		if (!Number.isInteger(gid)) return json({ ok: false, error: 'Bad group' }, { status: 400 });

		// Authorization: requester must be an ACTIVE member of this group.
		const mine = await adminExecute(
			MEMBER_MODEL,
			'search_read',
			[
				[
					['x_studio_group_id', '=', gid],
					['x_studio_user_id', '=', me],
					['x_studio_status', '=', 'active']
				]
			],
			{ fields: ['id'], limit: 1 }
		);
		if (!mine.length) return json({ ok: false, error: 'Not a member' }, { status: 403 });

		const g = await adminExecute(GROUP_MODEL, 'read', [[gid]], {
			fields: ['x_name', 'x_studio_owner_id']
		});
		const name = g?.[0]?.x_name || 'Group';
		const isOwner = m2oId(g?.[0]?.x_studio_owner_id) === me;

		// All rows for this group (active scored on the board; pending shown to owner).
		const members = await adminExecute(MEMBER_MODEL, 'search_read', [[['x_studio_group_id', '=', gid]]], {
			fields: ['id', 'x_studio_user_id', 'x_studio_status']
		});
		const active = members
			.filter((m) => m.x_studio_status === 'active')
			.map((m) => ({ id: m2oId(m.x_studio_user_id), name: m2oName(m.x_studio_user_id) }))
			.filter((u) => u.id);

		const scoreMap = await scoreByUser(active.map((u) => u.id));
		const rows = rankRows(active, scoreMap, me);

		// Owner-only management list: member rows with ids + status (incl. pending).
		const manage = isOwner
			? members.map((m) => ({
					memberId: m.id,
					name: m2oName(m.x_studio_user_id),
					status: m.x_studio_status,
					isOwnerRow: m2oId(m.x_studio_user_id) === me
				}))
			: [];

		return json({ ok: true, name, isOwner, rows, members: manage });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not load group' }, { status });
	}
}
