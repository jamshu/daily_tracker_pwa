// Store a device's push subscription in Odoo.
//
// Source of truth is Odoo's native mail.push.device (partner-keyed), written
// with the admin key and upserted by `endpoint` — an endpoint is unique per
// browser/device subscription. The app has no accounts, so each device gets its
// own auto-created res.partner keyed by a UUID in `ref`.
import { json } from '@sveltejs/kit';
import { adminExecute, findOrCreateDevicePartner, odooConfigured } from '$lib/server/odoo.js';
import { rescheduleForPartner } from '$lib/server/reminders.js';

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
		//
		// Write rather than unlink+create: mail.push rows carry an FK to
		// mail.push.device, so once Odoo has queued a push the row can't be
		// deleted — the follow-up create would then violate unique(endpoint).
		const keysJson = JSON.stringify({ p256dh: keys.p256dh, auth: keys.auth });
		const existing = await adminExecute('mail.push.device', 'search', [[['endpoint', '=', endpoint]]]);
		if (existing.length) {
			await adminExecute('mail.push.device', 'write', [existing, { partner_id: partnerId, keys: keysJson }]);
		} else {
			try {
				await adminExecute('mail.push.device', 'create', [{ partner_id: partnerId, endpoint, keys: keysJson }]);
			} catch (err) {
				// Lost a race with a concurrent subscribe — fall back to updating.
				const again = await adminExecute('mail.push.device', 'search', [[['endpoint', '=', endpoint]]]);
				if (!again.length) throw err;
				await adminExecute('mail.push.device', 'write', [again, { partner_id: partnerId, keys: keysJson }]);
			}
		}

		// Schedule straight away. Waiting for the nightly cron would mean enabling
		// a reminder at 21:00 produces nothing until the next cron run.
		const scheduled = await rescheduleForPartner(partnerId, { reminderTime, tz });

		return json({ ok: true, partnerId, scheduled });
	} catch (e) {
		console.error('[push/subscribe] failed:', e?.message);
		return json({ ok: false, error: e?.message || 'Subscribe failed' }, { status: 500 });
	}
}
