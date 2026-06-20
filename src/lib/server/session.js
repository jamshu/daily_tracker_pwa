// httpOnly session cookie helpers. We store the Odoo web session id here; the
// browser never sees it from JavaScript. `secure` is handled automatically by
// SvelteKit (true over HTTPS, false on http://localhost in dev).
export const SESSION_COOKIE = 'app_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days — "stay logged in"

export function setSessionCookie(cookies, sessionId) {
	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: MAX_AGE
	});
}

export function clearSessionCookie(cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSession(cookies) {
	return cookies.get(SESSION_COOKIE) || null;
}

// The user's Odoo call context ({ lang, tz, uid, allowed_company_ids }), captured
// at login so the proxy can pass it without a live session lookup. Not secret,
// but httpOnly keeps it tamper-resistant from page scripts.
export const CONTEXT_COOKIE = 'app_ctx';

export function setContextCookie(cookies, ctx) {
	cookies.set(CONTEXT_COOKIE, JSON.stringify(ctx), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: MAX_AGE
	});
}

export function clearContextCookie(cookies) {
	cookies.delete(CONTEXT_COOKIE, { path: '/' });
}

export function getContext(cookies) {
	const raw = cookies.get(CONTEXT_COOKIE);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
