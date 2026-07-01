import { json } from '@sveltejs/kit';
import { requireUid } from '$lib/server/auth.js';
import { adminExecute } from '$lib/server/odoo.js';

export const prerender = false;

const SUB_MODEL = 'x_push_subscription';

// Store a native APNs/FCM token in x_push_subscription.
//   x_studio_endpoint     = device token
//   x_studio_keys_p256dh  = platform ('android' | 'ios')
//   x_studio_keys_auth    = platform  ← routing key: 'ios' → APNs, 'android' → FCM
export async function POST({ request, cookies }) {
	try {
		const uid = await requireUid(cookies);
		const { token, platform, deviceId } = (await request.json()) ?? {};
		if (!token || !platform || !deviceId) {
			return json({ ok: false, error: 'token, platform, deviceId required' }, { status: 400 });
		}
		const existing = await adminExecute(SUB_MODEL, 'search', [
			[
				['x_studio_user_id', '=', uid],
				['x_studio_device_id', '=', deviceId]
			]
		]);
		if (existing.length) await adminExecute(SUB_MODEL, 'unlink', [existing]);
		await adminExecute(SUB_MODEL, 'create', [
			{
				x_name: `native_${deviceId.slice(0, 8)}`,
				x_studio_user_id: uid,
				x_studio_endpoint: platform === 'ios' ? token.toLowerCase() : token,
				x_studio_keys_p256dh: platform,
				x_studio_keys_auth: platform,
				x_studio_device_id: deviceId
			}
		]);
		return json({ ok: true });
	} catch (e) {
		console.error('[push/native-register] POST failed:', e?.message);
		return json({ ok: false, error: e?.message }, { status: e?.status || 500 });
	}
}
