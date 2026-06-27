import { json } from '@sveltejs/kit';
import { requireUid } from '$lib/server/auth.js';
import { adminExecute } from '$lib/server/odoo.js';

export const prerender = false;

const REMINDER_MODEL = 'x_reminder';
const MAX_REMINDERS = 10;

export async function GET({ cookies }) {
	try {
		const uid = await requireUid(cookies);
		const reminders = await adminExecute(
			REMINDER_MODEL,
			'search_read',
			[[['x_studio_user_id', '=', uid], ['x_studio_status', '=', 'active']]],
			{ fields: ['id', 'x_name', 'x_studio_datetime'], order: 'x_studio_datetime asc' }
		);
		return json({ ok: true, reminders });
	} catch (e) {
		return json({ ok: false, error: e?.message }, { status: e?.status || 500 });
	}
}

export async function POST({ request, cookies }) {
	try {
		const uid = await requireUid(cookies);
		const body = (await request.json()) ?? {};

		if (body.action === 'add') {
			const title = String(body.title || '').trim().slice(0, 60);
			// Client sends a UTC datetime "YYYY-MM-DD HH:MM:SS" (already converted from the
			// user's local time). Tolerate a trailing 'T' or missing seconds just in case.
			let odooDatetime = String(body.datetime || '').trim().replace('T', ' ');
			if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(odooDatetime)) odooDatetime += ':00';
			if (!title || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(odooDatetime)) {
				return json({ ok: false, error: 'Invalid reminder data' }, { status: 400 });
			}
			// Enforce max
			const count = await adminExecute(REMINDER_MODEL, 'search_count', [
				[['x_studio_user_id', '=', uid], ['x_studio_status', '=', 'active']]
			]);
			if (count >= MAX_REMINDERS) {
				return json({ ok: false, error: `Maximum ${MAX_REMINDERS} active reminders` }, { status: 400 });
			}
			const id = await adminExecute(REMINDER_MODEL, 'create', [
				{
					x_studio_user_id: uid,
					x_name: title,
					x_studio_datetime: odooDatetime,
					x_studio_status: 'active'
				}
			]);
			return json({ ok: true, id });
		}

		if (body.action === 'delete') {
			const id = Number(body.id);
			if (!id) return json({ ok: false, error: 'id required' }, { status: 400 });
			// Verify ownership before unlinking
			const rows = await adminExecute(REMINDER_MODEL, 'search', [
				[['id', '=', id], ['x_studio_user_id', '=', uid]]
			]);
			if (!rows.length) return json({ ok: false, error: 'Not found' }, { status: 404 });
			await adminExecute(REMINDER_MODEL, 'unlink', [[id]]);
			return json({ ok: true });
		}

		return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	} catch (e) {
		return json({ ok: false, error: e?.message }, { status: e?.status || 500 });
	}
}
