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
