// Register a device's push subscription in Odoo.
//
// Two records per device:
//   mail.push.device  — Odoo's native delivery target (partner-keyed)
//   x_preference      — the reminder time/timezone, read by the Odoo scheduled
//                       action "Daily Tracker: queue push reminders", which
//                       creates the mail.scheduled.message rows.
//
// The app never schedules anything itself; all recurring logic lives in Odoo.
import { json } from '@sveltejs/kit';
import {
	adminExecute,
	findOrCreateDevicePartner,
	odooConfigured,
	upsertPreference,
	triggerReminderCron
} from '$lib/server/odoo.js';

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
		await adminExecute('res.partner', 'write', [[partnerId], { tz: tz || 'UTC' }]);

		// Upsert by endpoint, writing rather than delete-then-create: mail.push
		// rows hold an FK to mail.push.device, so once Odoo has queued a push the
		// row can't be deleted and the follow-up create would violate
		// unique(endpoint).
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

		await upsertPreference({ partnerId, deviceId, endpoint, reminderTime, tz, name });

		// Kick the daily cron so a reminder enabled this evening still queues today.
		await triggerReminderCron().catch(() => {});

		return json({ ok: true, partnerId });
	} catch (e) {
		console.error('[push/subscribe] failed:', e?.message);
		return json({ ok: false, error: e?.message || 'Subscribe failed' }, { status: 500 });
	}
}
