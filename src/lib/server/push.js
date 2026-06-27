import webpush from 'web-push';
import { env } from '$env/dynamic/private';
import { adminExecute } from './odoo.js';

const SUB_MODEL = 'x_push_subscription';

let vapidSet = false;
function ensureVapid() {
	if (vapidSet) return;
	webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
	vapidSet = true;
}

async function removeStaleSub(endpoint) {
	try {
		const ids = await adminExecute(SUB_MODEL, 'search', [[['x_studio_endpoint', '=', endpoint]]]);
		if (ids.length) await adminExecute(SUB_MODEL, 'unlink', [ids]);
	} catch {
		/* best-effort */
	}
}

/** Send a push to one subscription object {endpoint, keys:{p256dh, auth}}. */
export async function sendPush(sub, payload) {
	ensureVapid();
	try {
		await webpush.sendNotification(sub, JSON.stringify(payload));
	} catch (err) {
		console.error(
			`[push] sendNotification failed: status=${err.statusCode} body=${err.body} endpoint=${sub.endpoint?.slice(0, 40)}`
		);
		if (err.statusCode === 404 || err.statusCode === 410) {
			await removeStaleSub(sub.endpoint);
		}
		// Don't throw — a failed push must never break the calling request
	}
}

/** Send to all devices registered for one user. */
export async function sendToUser(userId, payload) {
	const rows = await adminExecute(
		SUB_MODEL,
		'search_read',
		[[['x_studio_user_id', '=', userId]]],
		{ fields: ['x_studio_endpoint', 'x_studio_keys_p256dh', 'x_studio_keys_auth'] }
	);
	await Promise.allSettled(
		rows.map((r) =>
			sendPush(
				{
					endpoint: r.x_studio_endpoint,
					keys: { p256dh: r.x_studio_keys_p256dh, auth: r.x_studio_keys_auth }
				},
				payload
			)
		)
	);
}

/** Broadcast to all subscribed users. Returns subscriber count. */
export async function sendToAll(payload) {
	const rows = await adminExecute(SUB_MODEL, 'search_read', [[]], {
		fields: ['x_studio_user_id', 'x_studio_endpoint', 'x_studio_keys_p256dh', 'x_studio_keys_auth']
	});
	console.log(`[push] sendToAll: ${rows.length} subscription(s) found`);
	if (!rows.length) return 0;
	const results = await Promise.allSettled(
		rows.map((r) =>
			sendPush(
				{
					endpoint: r.x_studio_endpoint,
					keys: { p256dh: r.x_studio_keys_p256dh, auth: r.x_studio_keys_auth }
				},
				payload
			)
		)
	);
	const failed = results.filter((r) => r.status === 'rejected').length;
	if (failed) console.error(`[push] sendToAll: ${failed}/${rows.length} push(es) failed`);
	return rows.length;
}
