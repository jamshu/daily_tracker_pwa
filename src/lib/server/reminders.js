// Building the daily reminder queue in Odoo.
//
// We never send push ourselves: we create mail.scheduled.message rows and let
// Odoo's stock "Mail: Post scheduled messages" cron post them. Posting notifies
// the recipient partner, which is what triggers Odoo's native web push to that
// partner's mail.push.device rows.
import { adminExecute, botPartnerId } from './odoo.js';

export const HORIZON_DAYS = 14;

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

/** Wall-clock time in `tz` -> the real UTC instant (DST-safe via a second pass). */
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

export function nextOccurrences(reminderTime, tz, days = HORIZON_DAYS) {
	const [hh, mm] = String(reminderTime).split(':').map(Number);
	if (!Number.isFinite(hh) || !Number.isFinite(mm)) return [];
	const out = [];
	const now = Date.now();
	const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	})
		.format(new Date())
		.split('-')
		.map(Number);

	for (let i = 0; i <= days; i++) {
		const base = new Date(Date.UTC(y, m - 1, d + i));
		const inst = zonedToUtc(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), hh, mm, tz);
		// 30s guard so "in a minute" still schedules rather than landing in the past
		if (inst.getTime() > now + 30_000) out.push(inst);
		if (out.length >= days) break;
	}
	return out;
}

/** Parse the prefs JSON we stash on the partner's (html) comment field. */
export function parsePrefs(comment) {
	try {
		return JSON.parse(String(comment || '{}').replace(/<[^>]*>/g, '').trim() || '{}');
	} catch {
		return {};
	}
}

const BODY = `<p>Time to log today's prayers and deeds.</p><p><a href="https://deedapp.net/">Open Daily Tracker</a></p>`;

/**
 * Rebuild one partner's reminder queue. Idempotent: clears their still-pending
 * reminders first, so re-running never duplicates.
 * @returns number of messages created
 */
export async function rescheduleForPartner(partnerId, { reminderTime, tz }) {
	const author = await botPartnerId();

	const pending = await adminExecute('mail.scheduled.message', 'search', [
		[
			['partner_ids', 'in', [partnerId]],
			['author_id', '=', author]
		]
	]);
	if (pending.length) await adminExecute('mail.scheduled.message', 'unlink', [pending]);

	if (!reminderTime) return 0;
	const when = nextOccurrences(reminderTime, tz || 'UTC');
	if (!when.length) return 0;

	await adminExecute('mail.scheduled.message', 'create', [
		when.map((dt) => ({
			model: 'res.partner',
			res_id: partnerId,
			// Never the recipient: Odoo skips notifying a message's own author.
			author_id: author,
			partner_ids: [[6, 0, [partnerId]]],
			subject: 'Daily Tracker reminder',
			body: BODY,
			scheduled_date: toOdoo(dt),
			// 'comment' pushes to all recipients; the default 'notification' only
			// reaches inbox-preference users, leaving phones silent.
			notification_parameters: JSON.stringify({
				message_type: 'comment',
				email_layout_xmlid: 'mail.mail_notification_light'
			})
		}))
	]);
	return when.length;
}
