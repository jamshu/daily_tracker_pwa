// Remove a device's push subscription and cancel its pending reminders.
import { json } from '@sveltejs/kit';
import { adminExecute, odooConfigured } from '$lib/server/odoo.js';

export const prerender = false;

export async function POST({ request }) {
	try {
		if (!odooConfigured()) return json({ ok: true, skipped: 'not configured' });

		const { endpoint, deviceId } = (await request.json()) ?? {};
		if (!endpoint && !deviceId) {
			return json({ ok: false, error: 'endpoint or deviceId required' }, { status: 400 });
		}

		if (endpoint) {
			const ids = await adminExecute('mail.push.device', 'search', [[['endpoint', '=', endpoint]]]);
			if (ids.length) await adminExecute('mail.push.device', 'unlink', [ids]);
		}

		// Drop queued reminders so they don't keep firing at a dead endpoint.
		if (deviceId) {
			const partners = await adminExecute('res.partner', 'search', [[['ref', '=', `dtl-device-${deviceId}`]]], {
				limit: 1
			});
			if (partners.length) {
				const pending = await adminExecute('mail.scheduled.message', 'search', [
					[['partner_ids', 'in', partners]]
				]);
				if (pending.length) await adminExecute('mail.scheduled.message', 'unlink', [pending]);
			}
		}

		return json({ ok: true });
	} catch (e) {
		console.error('[push/unsubscribe] failed:', e?.message);
		return json({ ok: false, error: e?.message || 'Unsubscribe failed' }, { status: 500 });
	}
}
