import { browser } from '$app/environment';
import { base } from '$app/paths';
import { env } from '$env/dynamic/public';

function getDeviceId() {
	let id = localStorage.getItem('push_device_id');
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem('push_device_id', id);
	}
	return id;
}

export function pushSupported() {
	return browser && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getPermission() {
	if (!pushSupported()) return 'unsupported';
	return Notification.permission;
}

export async function currentSubscription() {
	if (!pushSupported()) return null;
	const reg = await navigator.serviceWorker.ready;
	return reg.pushManager.getSubscription();
}

export async function subscribePush() {
	if (!pushSupported()) throw new Error('Push not supported in this browser');
	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(env.PUBLIC_VAPID_PUBLIC_KEY)
	});
	const raw = sub.toJSON();
	const res = await fetch(`${base}/api/push/subscribe`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ endpoint: raw.endpoint, keys: raw.keys, deviceId: getDeviceId() })
	});
	if (!res.ok) throw new Error('Failed to save subscription');
	return sub;
}

export async function unsubscribePush() {
	if (!pushSupported()) return;
	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.getSubscription();
	if (sub) {
		await sub.unsubscribe();
		await fetch(`${base}/api/push/subscribe`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ deviceId: getDeviceId() })
		});
	}
}

function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
