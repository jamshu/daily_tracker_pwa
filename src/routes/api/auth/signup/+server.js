import { json } from '@sveltejs/kit';
import {
	assertConfigured,
	createTenantUser,
	authenticateUser,
	buildSessionContext
} from '$lib/server/odoo.js';
import { setSessionCookie, setContextCookie } from '$lib/server/session.js';

export const prerender = false;

// NOTE: open signup creates an Odoo user + company using the admin API key.
// In production, gate this with a CAPTCHA / invite code / rate limiting to
// prevent abuse and runaway user-seat usage.
export async function POST({ request, cookies }) {
	try {
		assertConfigured();
		const { name, email, password } = await request.json();

		if (!name || !email || !password) {
			return json({ ok: false, error: 'Name, email and password are required' }, { status: 400 });
		}
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			return json({ ok: false, error: 'Please enter a valid email address' }, { status: 400 });
		}
		if (String(password).length < 6) {
			return json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		await createTenantUser({ name, email, password });

		// log the new user straight in
		const { sessionId, info } = await authenticateUser(email, password);
		setSessionCookie(cookies, sessionId);
		setContextCookie(cookies, buildSessionContext(info)); // { lang, tz, uid, allowed_company_ids }

		return json({ ok: true, user: { name: info.name || name, email, uid: info.uid } });
	} catch (e) {
		return json({ ok: false, error: e?.message || 'Sign up failed' }, { status: e?.status || 500 });
	}
}
