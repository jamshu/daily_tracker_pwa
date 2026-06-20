import { json } from '@sveltejs/kit';
import { sessionInfo } from '$lib/server/odoo.js';
import { getSession, clearSessionCookie } from '$lib/server/session.js';

export const prerender = false;

export async function GET({ cookies }) {
	const sid = getSession(cookies);
	if (!sid) return json({ ok: false }, { status: 401 });
	try {
		const info = await sessionInfo(sid);
		return json({
			ok: true,
			user: {
				name: info.name || info.username,
				email: info.username,
				uid: info.uid
			}
		});
	} catch {
		clearSessionCookie(cookies);
		return json({ ok: false }, { status: 401 });
	}
}
