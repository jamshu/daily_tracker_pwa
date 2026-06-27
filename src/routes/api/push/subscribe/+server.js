import { json } from '@sveltejs/kit';
import { requireUid } from '$lib/server/auth.js';
import { adminExecute } from '$lib/server/odoo.js';

export const prerender = false;

const SUB_MODEL = 'x_push_subscription';

export async function POST({ request, cookies }) {
	try {
		const uid = await requireUid(cookies);
		const body = await request.json();
		const { endpoint, keys, deviceId } = body ?? {};
		if (!endpoint || !keys?.p256dh || !keys?.auth || !deviceId) {
			return json({ ok: false, error: 'Invalid subscription data' }, { status: 400 });
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
				x_name: `push_${deviceId.slice(0, 8)}`,
				x_studio_user_id: uid,
				x_studio_endpoint: endpoint,
				x_studio_keys_p256dh: keys.p256dh,
				x_studio_keys_auth: keys.auth,
				x_studio_device_id: deviceId
			}
		]);
		return json({ ok: true });
	} catch (e) {
		console.error('[push/subscribe] POST failed:', e?.message);
		return json({ ok: false, error: e?.message }, { status: e?.status || 500 });
	}
}

export async function DELETE({ request, cookies }) {
	try {
		const uid = await requireUid(cookies);
		const { deviceId } = (await request.json()) ?? {};
		if (!deviceId) return json({ ok: false, error: 'deviceId required' }, { status: 400 });
		const ids = await adminExecute(SUB_MODEL, 'search', [
			[
				['x_studio_user_id', '=', uid],
				['x_studio_device_id', '=', deviceId]
			]
		]);
		if (ids.length) await adminExecute(SUB_MODEL, 'unlink', [ids]);
		return json({ ok: true });
	} catch (e) {
		return json({ ok: false, error: e?.message }, { status: e?.status || 500 });
	}
}
