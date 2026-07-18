// Web push subscription for the daily reminder.
//
// The browser subscribes with Odoo's VAPID public key, so Odoo can sign the
// pushes it sends. The subscription is stored server-side (see
// /api/push/subscribe) against a res.partner in Odoo — the app itself has no
// accounts, so a per-device UUID is the identity.
import { browser } from '$app/environment';
// static (not dynamic) because every page is prerendered with ssr=false —
// $env/dynamic/public needs a server to inject values at request time, so it
// arrives empty in the client bundle. static inlines the value at build time.
import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';

const VAPID_PUBLIC_KEY = PUBLIC_VAPID_PUBLIC_KEY || '';
const DEVICE_KEY = 'push_device_id';

export function pushSupported() {
	return browser && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Stable per-device id — the app has no accounts, so this is the identity. */
export function getDeviceId() {
	let id = localStorage.getItem(DEVICE_KEY);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(DEVICE_KEY, id);
	}
	return id;
}

async function swReady() {
	const existing = await navigator.serviceWorker.getRegistration();
	const reg = existing || (await navigator.serviceWorker.register('/sw.js'));
	if (reg?.active) return reg;
	// A worker that never activates would hang subscribe() forever.
	return Promise.race([
		navigator.serviceWorker.ready,
		new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker not active after 30s')), 30000))
	]);
}

export async function currentSubscription() {
	if (!pushSupported()) return null;
	try {
		const reg = await swReady();
		return await reg.pushManager.getSubscription();
	} catch {
		return null;
	}
}

/**
 * Subscribe this device and store it in Odoo.
 * MUST be called from a user gesture — browsers only prompt off a real click.
 */
export async function subscribePush({ name, reminderTime }) {
	if (!pushSupported()) throw new Error('Notifications are not supported on this browser.');
	if (!VAPID_PUBLIC_KEY) throw new Error('Push is not configured (missing VAPID key).');

	// A blocked origin resolves 'denied' with no prompt, and only the user can
	// undo it — say so rather than failing silently.
	if (Notification.permission === 'denied') {
		throw new Error(
			'Notifications are blocked for this site. Enable them in your browser/site settings, then try again.'
		);
	}
	const perm = await Notification.requestPermission();
	if (perm !== 'granted') throw new Error('Notification permission was not granted.');

	const reg = await swReady();
	let sub = await reg.pushManager.getSubscription();
	if (!sub) {
		sub = await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
		});
	}

	await saveSubscription(sub, { name, reminderTime });
	return sub;
}

/** Re-send the current subscription (e.g. after the user changes the time). */
export async function syncSubscription({ name, reminderTime }) {
	const sub = await currentSubscription();
	if (!sub) return false;
	await saveSubscription(sub, { name, reminderTime });
	return true;
}

async function saveSubscription(sub, { name, reminderTime }) {
	const raw = sub.toJSON();
	const res = await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			deviceId: getDeviceId(),
			name: (name || '').trim(),
			endpoint: raw.endpoint,
			keys: raw.keys,
			reminderTime: reminderTime || null,
			tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
		})
	});
	if (!res.ok) {
		const detail = await res.json().catch(() => ({}));
		throw new Error(detail.error || 'Could not save your reminder subscription.');
	}
}

export async function unsubscribePush() {
	if (!pushSupported()) return;
	const sub = await currentSubscription();
	if (!sub) return;
	const endpoint = sub.endpoint;
	await sub.unsubscribe().catch(() => {});
	await fetch('/api/push/unsubscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ endpoint, deviceId: getDeviceId() })
	}).catch(() => {});
}

function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
