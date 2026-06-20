import { json } from '@sveltejs/kit';
import { destroySession } from '$lib/server/odoo.js';
import { getSession, clearSessionCookie } from '$lib/server/session.js';

export const prerender = false;

export async function POST({ cookies }) {
	const sid = getSession(cookies);
	if (sid) await destroySession(sid);
	clearSessionCookie(cookies);
	return json({ ok: true });
}
