import { browser } from '$app/environment';
import { base } from '$app/paths';
import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';

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

export async function registerSW() {
	if (!browser || !('serviceWorker' in navigator)) return null;
	const existing = await navigator.serviceWorker.getRegistration();
	if (existing) return existing;
	return navigator.serviceWorker.register('/sw.js', { type: 'classic' });
}

async function swReady() {
	// vite-plugin-pwa does NOT auto-inject the registration script into SvelteKit's
	// HTML, so register explicitly here before awaiting activation.
	const reg = await registerSW();
	// First install precaches ~34 files; activation can take longer than navigator
	// .serviceWorker.ready's resolve timing on a fresh load. Resolve as soon as an
	// active worker exists, otherwise wait on `ready` with a generous timeout.
	if (reg?.active) return reg;
	return Promise.race([
		navigator.serviceWorker.ready,
		new Promise((_, reject) =>
			setTimeout(
				() => reject(new Error('SW not active after 30s — check DevTools > Application > Service Workers')),
				30000
			)
		)
	]);
}

export async function currentSubscription() {
	if (!pushSupported()) return null;
	const reg = await swReady();
	return reg.pushManager.getSubscription();
}

export async function subscribePush() {
	if (!pushSupported()) throw new Error('Push not supported in this browser');
	if (!PUBLIC_VAPID_PUBLIC_KEY) throw new Error('VAPID public key not configured');
	// Explicitly request permission. Chrome only shows the prompt from a user
	// gesture, so this must be called off a click/tap (see layout gesture hook).
	const perm = await Notification.requestPermission();
	if (perm !== 'granted') throw new Error(`Notification permission: ${perm}`);
	const reg = await swReady();
	const sub = await reg.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_PUBLIC_KEY)
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
	const reg = await swReady();
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
