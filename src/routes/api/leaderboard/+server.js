// Global leaderboard: only users who opted in (settings.shareGlobal === true)
// appear. Scores are computed server-side with the admin key and only
// { name, score, rank } is ever returned — never anyone's raw daily data.
import { json } from '@sveltejs/kit';
import { assertConfigured, adminExecute } from '$lib/server/odoo.js';
import { requireUid } from '$lib/server/auth.js';
import { clearSessionCookie } from '$lib/server/session.js';
import { scoreByUser, rankRows, SETTINGS_FIELD } from '$lib/server/leaderboard.js';

export const prerender = false;

function sharesGlobally(raw) {
	try {
		return JSON.parse(raw || '{}')?.shareGlobal === true;
	} catch {
		return false;
	}
}

export async function GET({ cookies }) {
	try {
		assertConfigured();
		const me = await requireUid(cookies);

		const all = await adminExecute('res.users', 'search_read', [[['active', '=', true]]], {
			fields: ['id', 'name', SETTINGS_FIELD]
		});
		const meRow = all.find((u) => u.id === me);
		const shareGlobal = sharesGlobally(meRow?.[SETTINGS_FIELD]);

		const sharers = all.filter((u) => sharesGlobally(u[SETTINGS_FIELD]));
		const scoreMap = await scoreByUser(sharers.map((u) => u.id));
		const rows = rankRows(sharers, scoreMap, me);
		const myRank = rows.find((r) => r.isMe)?.rank ?? null;

		return json({ ok: true, rows, shareGlobal, myRank });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not load leaderboard' }, { status });
	}
}
