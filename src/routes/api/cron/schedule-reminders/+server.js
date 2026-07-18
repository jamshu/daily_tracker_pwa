// Rebuild the queue of daily reminder messages.
//
// We don't send push ourselves — we create mail.scheduled.message rows and let
// Odoo's stock "Mail: Post scheduled messages" cron post them. Posting notifies
// the recipient partner, which is what triggers Odoo's native web push to that
// partner's mail.push.device rows.
//
// Idempotent: every run deletes this partner's still-pending reminders and
// recreates the window, so re-running never duplicates.
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminExecute, botPartnerId, odooConfigured } from '$lib/server/odoo.js';

export const prerender = false;

const HORIZON_DAYS = 14;

/** Offset (ms) of `tz` from UTC at the given instant. */
function tzOffsetMs(date, tz) {
	const dtf = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
	const p = Object.fromEntries(
		dtf
			.formatToParts(date)
			.filter((x) => x.type !== 'literal')
			.map((x) => [x.type, x.value])
	);
	const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
	return asUTC - date.getTime();
}

/** Wall-clock time in `tz` -> the real UTC instant (DST-safe via second pass). */
function zonedToUtc(y, m, d, hh, mm, tz) {
	const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
	const off1 = tzOffsetMs(new Date(guess), tz);
	let ts = guess - off1;
	const off2 = tzOffsetMs(new Date(ts), tz);
	if (off2 !== off1) ts = guess - off2;
	return new Date(ts);
}

/** Odoo wants naive UTC: 'YYYY-MM-DD HH:MM:SS'. */
const toOdoo = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

function nextOccurrences(reminderTime, tz, days) {
	const [hh, mm] = String(reminderTime).split(':').map(Number);
	if (!Number.isFinite(hh) || !Number.isFinite(mm)) return [];
	const out = [];
	const now = Date.now();
	// Start from "today" in the user's zone, walk forward, keep future instants.
	const todayParts = new Intl.DateTimeFormat('en-CA', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
	const [y, m, d] = todayParts.split('-').map(Number);

	for (let i = 0; i <= days; i++) {
		const base = new Date(Date.UTC(y, m - 1, d + i));
		const inst = zonedToUtc(
			base.getUTCFullYear(),
			base.getUTCMonth() + 1,
			base.getUTCDate(),
			hh,
			mm,
			tz
		);
		if (inst.getTime() > now + 60_000) out.push(inst);
		if (out.length >= days) break;
	}
	return out;
}

const BODY = `<p>Time to log today's prayers and deeds.</p><p><a href="https://deedapp.net/">Open Daily Tracker</a></p>`;

export async function POST({ request, url }) {
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
		const author = await botPartnerId();

		// Only partners that actually have a registered device are worth scheduling.
		const devices = await adminExecute('mail.push.device', 'search_read', [[]], {
			fields: ['partner_id']
		});
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
			let prefs = {};
			try {
				// comment is an html field; strip tags before parsing our JSON blob.
				prefs = JSON.parse(String(p.comment || '{}').replace(/<[^>]*>/g, '').trim() || '{}');
			} catch {
				prefs = {};
			}
			if (!prefs.reminderTime) {
				skipped++;
				continue;
			}

			// Clear this partner's still-pending reminders, then rebuild.
			const pending = await adminExecute('mail.scheduled.message', 'search', [
				[['partner_ids', 'in', [p.id]], ['author_id', '=', author]]
			]);
			if (pending.length) await adminExecute('mail.scheduled.message', 'unlink', [pending]);

			const when = nextOccurrences(prefs.reminderTime, p.tz || 'UTC', HORIZON_DAYS);
			if (!when.length) {
				skipped++;
				continue;
			}

			await adminExecute('mail.scheduled.message', 'create', [
				when.map((dt) => ({
					model: 'res.partner',
					res_id: p.id,
					author_id: author, // never the recipient — Odoo skips a message's own author
					partner_ids: [[6, 0, [p.id]]],
					subject: 'Daily Tracker reminder',
					body: BODY,
					scheduled_date: toOdoo(dt),
					// 'comment' pushes to all recipients; the default 'notification'
					// only reaches inbox-preference users, leaving phones silent.
					notification_parameters: JSON.stringify({
						message_type: 'comment',
						email_layout_xmlid: 'mail.mail_notification_light'
					})
				}))
			]);
			created += when.length;
		}

		return json({ ok: true, partners: partners.length, created, skipped });
	} catch (e) {
		console.error('[cron/schedule-reminders] failed:', e?.message);
		return json({ ok: false, error: e?.message || 'Cron failed' }, { status: 500 });
	}
}

// Vercel cron issues GET requests.
export async function GET(event) {
	return POST(event);
}
