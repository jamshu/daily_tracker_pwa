import { json } from '@sveltejs/kit';
import { requireUid } from '$lib/server/auth.js';
import { adminExecute } from '$lib/server/odoo.js';

export const prerender = false;

const SUB_MODEL = 'x_push_subscription';

// Store a native FCM/APNs registration token in the same x_push_subscription model.
// We reuse the VAPID subscription fields with a type marker:
//   x_studio_endpoint     = FCM registration token
//   x_studio_keys_p256dh  = platform ('android' | 'ios')
//   x_studio_keys_auth    = 'fcm'  ← type discriminator (server/push.js routes on this)
export async function POST({ request, cookies }) {
	try {
		const uid = await requireUid(cookies);
		const { token, platform, deviceId } = (await request.json()) ?? {};
		if (!token || !platform || !deviceId) {
			return json({ ok: false, error: 'token, platform, deviceId required' }, { status: 400 });
		}
		// Upsert: remove any existing record for this device, then create fresh
		const existing = await adminExecute(SUB_MODEL, 'search', [
			[
				['x_studio_user_id', '=', uid],
				['x_studio_device_id', '=', deviceId]
			]
		]);
		if (existing.length) await adminExecute(SUB_MODEL, 'unlink', [existing]);
		await adminExecute(SUB_MODEL, 'create', [
			{
				x_name: `fcm_${deviceId.slice(0, 8)}`,
				x_studio_user_id: uid,
				x_studio_endpoint: token,
				x_studio_keys_p256dh: platform,
				x_studio_keys_auth: 'fcm',
				x_studio_device_id: deviceId
			}
		]);
		return json({ ok: true });
	} catch (e) {
		console.error('[push/native-register] POST failed:', e?.message);
		return json({ ok: false, error: e?.message }, { status: e?.status || 500 });
	}
}
