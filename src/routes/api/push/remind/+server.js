import { json } from '@sveltejs/kit';
import { requireUid } from '$lib/server/auth.js';
import { adminExecute } from '$lib/server/odoo.js';
import { sendToAll } from '$lib/server/push.js';

export const prerender = false;

const SETTINGS_FIELD = 'x_studio_settings';

async function requireAdmin(cookies) {
	const uid = await requireUid(cookies);
	const rows = await adminExecute('res.users', 'read', [[uid]], { fields: [SETTINGS_FIELD] });
	let s = {};
	try { s = JSON.parse(rows?.[0]?.[SETTINGS_FIELD] || '{}'); } catch { /* ignore */ }
	if (s?.is_admin !== true) {
		const e = new Error('Forbidden');
		e.status = 403;
		throw e;
	}
}

export async function POST({ cookies }) {
	try {
		await requireAdmin(cookies);
		await sendToAll({
			title: 'Daily Tracker',
			body: "Don't forget to mark today's score!",
			url: '/'
		});
		return json({ ok: true });
	} catch (e) {
		return json({ ok: false, error: e?.message }, { status: e?.status || 500 });
	}
}
