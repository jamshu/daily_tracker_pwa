// Step 2 of password reset: verify the 6-digit code stored on the user's
// x_studio_settings JSON, set the new password, then consume (delete) the code.
import { json } from '@sveltejs/kit';
import {
	assertConfigured,
	findUserByLogin,
	readUserSettings,
	writeUserSettings,
	setUserPassword
} from '$lib/server/odoo.js';

export const prerender = false;

export async function POST({ request }) {
	try {
		assertConfigured();
		const { email, code, password, confirm } = await request.json();

		if (!email || !code || !password) {
			return json(
				{ ok: false, error: 'Email, reset code and new password are required' },
				{ status: 400 }
			);
		}
		if (String(password).length < 6) {
			return json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 });
		}
		if (confirm != null && String(password) !== String(confirm)) {
			return json({ ok: false, error: 'Passwords do not match' }, { status: 400 });
		}

		// Same vague error for every failure mode so we don't leak account state.
		const invalid = () =>
			json({ ok: false, error: 'Invalid or expired reset code' }, { status: 400 });

		const user = await findUserByLogin(String(email).trim());
		if (!user) return invalid();

		let settings = {};
		try {
			settings = JSON.parse((await readUserSettings(user.id)) || '{}') || {};
		} catch {
			settings = {};
		}

		const pr = settings.password_reset;
		if (!pr || !pr.code) return invalid();
		if (Date.now() > Number(pr.expires || 0)) return invalid();
		if (String(pr.code) !== String(code).trim()) return invalid();

		await setUserPassword(user.id, password);

		// Consume the code so it can't be reused.
		delete settings.password_reset;
		await writeUserSettings(user.id, JSON.stringify(settings));

		return json({ ok: true });
	} catch (e) {
		return json(
			{ ok: false, error: e?.message || 'Could not reset password' },
			{ status: e?.status || 500 }
		);
	}
}
