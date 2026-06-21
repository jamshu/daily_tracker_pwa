// Step 1 of password reset: generate a 6-digit code, append it to the user's
// x_studio_settings JSON, and email it via an Odoo email template (id in .env).
// Responds ok even when the email is unknown, so the endpoint can't be used to
// probe which addresses have accounts.
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	assertConfigured,
	findUserByLogin,
	readUserSettings,
	writeUserSettings,
	sendResetCodeEmail
} from '$lib/server/odoo.js';

export const prerender = false;

const CODE_TTL_MS = 15 * 60 * 1000; // codes are valid for 15 minutes

// 6 digits, never a leading zero so the full code always shows.
const gen6 = () => String(Math.floor(100000 + Math.random() * 900000));

// Append onto the existing settings JSON without clobbering other keys.
function mergeSettings(raw, patch) {
	let obj = {};
	try {
		obj = JSON.parse(raw || '{}') || {};
	} catch {
		obj = {};
	}
	if (!obj || typeof obj !== 'object') obj = {};
	return { ...obj, ...patch };
}

export async function POST({ request }) {
	try {
		assertConfigured();
		if (!env.ODOO_RESET_TEMPLATE_ID) {
			return json({ ok: false, error: 'Password reset is not configured' }, { status: 500 });
		}

		const { email } = await request.json();
		if (!email) return json({ ok: false, error: 'Email is required' }, { status: 400 });

		const user = await findUserByLogin(String(email).trim());
		if (user) {
			const code = gen6();
			const settings = mergeSettings(await readUserSettings(user.id), {
				password_reset: { code, expires: Date.now() + CODE_TTL_MS }
			});
			await writeUserSettings(user.id, JSON.stringify(settings));
			await sendResetCodeEmail(env.ODOO_RESET_TEMPLATE_ID, user.id, code);
		}

		// Same response whether or not the account exists.
		return json({ ok: true });
	} catch (e) {
		return json(
			{ ok: false, error: e?.message || 'Could not send reset code' },
			{ status: e?.status || 500 }
		);
	}
}
