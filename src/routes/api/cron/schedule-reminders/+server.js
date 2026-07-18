// Top up every registered device's reminder queue.
//
// Subscribing already schedules immediately (see api/push/subscribe); this cron
// keeps the rolling window full so reminders don't run out for people who never
// reopen the app. Idempotent — rescheduleForPartner clears before it creates.
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminExecute, odooConfigured } from '$lib/server/odoo.js';
import { rescheduleForPartner, parsePrefs } from '$lib/server/reminders.js';

export const prerender = false;

async function run(request, url) {
	const secret = env.CRON_SECRET;
	const provided =
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
		request.headers.get('x-cron-secret') ||
		url.searchParams.get('secret');
	if (secret && provided !== secret) {
		return json({ ok: false, error: 'unauthorized' }, { status: 401 });
	}
	if (!odooConfigured()) return json({ ok: false, error: 'Odoo not configured' }, { status: 503 });

	try {
		// Only partners with a registered device are worth scheduling.
		const devices = await adminExecute('mail.push.device', 'search_read', [[]], { fields: ['partner_id'] });
		const partnerIds = [...new Set(devices.map((d) => d.partner_id?.[0]).filter(Boolean))];
		if (!partnerIds.length) return json({ ok: true, partners: 0, created: 0 });

		const partners = await adminExecute(
			'res.partner',
			'search_read',
			[[['id', 'in', partnerIds], ['ref', 'like', 'dtl-device-%']]],
			{ fields: ['id', 'tz', 'comment'] }
		);

		let created = 0;
		let skipped = 0;
		for (const p of partners) {
			const prefs = parsePrefs(p.comment);
			if (!prefs.reminderTime) {
				skipped++;
				continue;
			}
			created += await rescheduleForPartner(p.id, { reminderTime: prefs.reminderTime, tz: p.tz || 'UTC' });
		}
		return json({ ok: true, partners: partners.length, created, skipped });
	} catch (e) {
		console.error('[cron/schedule-reminders] failed:', e?.message);
		return json({ ok: false, error: e?.message || 'Cron failed' }, { status: 500 });
	}
}

export const GET = ({ request, url }) => run(request, url);
export const POST = ({ request, url }) => run(request, url);
