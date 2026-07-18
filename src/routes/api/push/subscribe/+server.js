// Store a device's push subscription in Odoo.
//
// Source of truth is Odoo's native mail.push.device (partner-keyed), written
// with the admin key and upserted by `endpoint` — an endpoint is unique per
// browser/device subscription. The app has no accounts, so each device gets its
// own auto-created res.partner keyed by a UUID in `ref`.
import { json } from '@sveltejs/kit';
import { adminExecute, findOrCreateDevicePartner, odooConfigured } from '$lib/server/odoo.js';

export const prerender = false;

export async function POST({ request }) {
	try {
		if (!odooConfigured()) {
			return json({ ok: false, error: 'Server is not configured for reminders.' }, { status: 503 });
		}

		const { deviceId, name, endpoint, keys, reminderTime, tz } = (await request.json()) ?? {};
		if (!deviceId) return json({ ok: false, error: 'deviceId required' }, { status: 400 });
		if (!endpoint || !keys?.p256dh || !keys?.auth) {
			return json({ ok: false, error: 'Invalid subscription data' }, { status: 400 });
		}

		const partnerId = await findOrCreateDevicePartner({ deviceId, name });

		// Persist scheduling prefs on the partner so the cron can rebuild the
		// schedule without the app being open. tz is a native field; the reminder
		// time rides in `comment` as JSON (these are dedicated device partners).
		await adminExecute('res.partner', 'write', [
			[partnerId],
			{
				tz: tz || 'UTC',
				comment: JSON.stringify({ reminderTime: reminderTime || null, deviceId })
			}
		]);

		// Upsert by endpoint. `keys` is a JSON *string* in Odoo, not a dict.
		const existing = await adminExecute('mail.push.device', 'search', [[['endpoint', '=', endpoint]]]);
		if (existing.length) await adminExecute('mail.push.device', 'unlink', [existing]);
		await adminExecute('mail.push.device', 'create', [
			{
				partner_id: partnerId,
				endpoint,
				keys: JSON.stringify({ p256dh: keys.p256dh, auth: keys.auth })
			}
		]);

		return json({ ok: true, partnerId });
	} catch (e) {
		console.error('[push/subscribe] failed:', e?.message);
		return json({ ok: false, error: e?.message || 'Subscribe failed' }, { status: 500 });
	}
}
