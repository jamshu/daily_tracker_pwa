// Resolve the authenticated user's Odoo uid from the request cookies, refreshing
// the session cookie in the process. Throws a 401-tagged Error when there is no
// valid session. Shared by every authenticated API route.
import { getSession, getContext, refreshSessionCookie } from './session.js';
import { sessionInfo } from './odoo.js';

export async function requireUid(cookies) {
	const ctx = getContext(cookies);
	if (ctx?.uid) return ctx.uid;

	const sid = getSession(cookies);
	if (!sid) {
		const e = new Error('Not authenticated');
		e.status = 401;
		throw e;
	}
	const { result, sessionId } = await sessionInfo(sid);
	refreshSessionCookie(cookies, sessionId, sid);
	if (!result?.uid) {
		const e = new Error('Not authenticated');
		e.status = 401;
		throw e;
	}
	return result.uid;
}
