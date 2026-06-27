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
	return uid;
}

export async function POST({ request, cookies }) {
	try {
		await requireAdmin(cookies);
		const { title, message } = (await request.json()) ?? {};
		if (!title?.trim()) return json({ ok: false, error: 'Title is required' }, { status: 400 });

		const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
		await adminExecute('x_announcement', 'create', [
			{
				x_name: title.trim(),
				x_studio_message: (message || '').trim(),
				x_studio_sent_at: now
			}
		]);
		const count = await sendToAll({ title: title.trim(), body: (message || '').trim(), url: '/' });
		return json({ ok: true, count });
	} catch (e) {
		return json({ ok: false, error: e?.message }, { status: e?.status || 500 });
	}
}
