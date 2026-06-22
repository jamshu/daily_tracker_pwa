import { json } from '@sveltejs/kit';
import { sessionInfo, buildSessionContext } from '$lib/server/odoo.js';
import {
	getSession,
	clearSessionCookie,
	setContextCookie,
	refreshSessionCookie
} from '$lib/server/session.js';

export const prerender = false;

export async function GET({ cookies }) {
	const sid = getSession(cookies);
	if (!sid) return json({ ok: false }, { status: 401 });
	try {
		const { result: info, sessionId } = await sessionInfo(sid);
		// Keep the cookie in sync with any rotated id + slide the 30-day expiry.
		refreshSessionCookie(cookies, sessionId, sid);
		// refresh the cached context for sessions restored from an old cookie
		setContextCookie(cookies, buildSessionContext(info));
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
