import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sendToAll } from '$lib/server/push.js';

export const prerender = false;

export async function GET({ request }) {
	const auth = request.headers.get('authorization') || '';
	if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
		return json({ ok: false }, { status: 401 });
	}

	// Broadcast daily score reminder to everyone
	await sendToAll({
		title: 'Daily Tracker',
		body: "Don't forget to mark today's score!",
		url: '/'
	});

	return json({ ok: true });
}
