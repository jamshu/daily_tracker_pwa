// User directory search for inviting people to a private group. Authenticated
// only; returns at most 10 minimal records (id, name, email) matching name OR
// login. Excludes the requester.
import { json } from '@sveltejs/kit';
import { assertConfigured, adminExecute } from '$lib/server/odoo.js';
import { requireUid } from '$lib/server/auth.js';
import { clearSessionCookie } from '$lib/server/session.js';

export const prerender = false;

export async function GET({ url, cookies }) {
	try {
		assertConfigured();
		const me = await requireUid(cookies);
		const q = (url.searchParams.get('q') || '').trim();
		if (q.length < 2) return json({ ok: true, users: [] });

		// active AND (id != me) AND (name ilike q OR login ilike q)
		const domain = [
			'&',
			'&',
			['active', '=', true],
			['id', '!=', me],
			'|',
			['name', 'ilike', q],
			['login', 'ilike', q]
		];
		const rows = await adminExecute('res.users', 'search_read', [domain], {
			fields: ['id', 'name', 'login'],
			limit: 10
		});
		const users = rows.map((r) => ({ id: r.id, name: r.name, email: r.login }));
		return json({ ok: true, users });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Search failed' }, { status });
	}
}
