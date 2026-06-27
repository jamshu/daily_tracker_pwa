import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminExecute } from '$lib/server/odoo.js';
import { sendToAll, sendToUser } from '$lib/server/push.js';

export const prerender = false;

export async function GET({ request }) {
	const auth = request.headers.get('authorization') || '';
	if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
		return json({ ok: false }, { status: 401 });
	}

	// 1. Broadcast daily score reminder to everyone
	await sendToAll({
		title: 'Daily Tracker',
		body: "Don't forget to mark today's score!",
		url: '/'
	});

	// 2. Fire any active user reminders that are due
	try {
		const nowOdoo = new Date().toISOString().replace('T', ' ').slice(0, 19);
		// Daily cron: fire all active reminders due on or before now.
		// Reminders may be up to ~24h late (next daily run) — acceptable for this plan.
		const due = await adminExecute(
			'x_reminder',
			'search_read',
			[[['x_studio_status', '=', 'active'], ['x_studio_datetime', '<=', nowOdoo]]],
			{ fields: ['id', 'x_studio_user_id', 'x_name'] }
		);
		if (due.length) {
			await Promise.allSettled(
				due.map((r) => {
					const uid = Array.isArray(r.x_studio_user_id)
						? r.x_studio_user_id[0]
						: r.x_studio_user_id;
					return sendToUser(uid, { title: r.x_name, body: 'Your reminder', url: '/' });
				})
			);
			const sentIds = due.map((r) => r.id);
			await adminExecute('x_reminder', 'write', [sentIds, { x_studio_status: 'sent' }]);
		}
	} catch {
		// Reminder processing failure must not affect the overall 200 response
	}

	return json({ ok: true });
}
