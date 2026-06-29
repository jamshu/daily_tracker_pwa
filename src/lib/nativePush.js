import { goto } from '$app/navigation';
import { base } from '$app/paths';

let initPromise = null;

function getDeviceId() {
	let id = localStorage.getItem('push_device_id');
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem('push_device_id', id);
	}
	return id;
}

/**
 * Register for native push notifications (FCM/APNs) via @capacitor/push-notifications.
 * Guards against double-init. No-op on web. Must be called after user is authenticated
 * (the token registration POST to /api/push/native-register requires a valid cookie session).
 */
export function initNativePush() {
	if (initPromise) return initPromise;
	initPromise = _doInitNativePush();
	return initPromise;
}

async function _doInitNativePush() {
	const { Capacitor } = await import('@capacitor/core');
	if (!Capacitor.isNativePlatform()) return;

	const { PushNotifications } = await import('@capacitor/push-notifications');
	const platform = Capacitor.getPlatform();

	// Android 8+ requires at least one channel before notifications can appear
	if (platform === 'android') {
		await PushNotifications.createChannel({
			id: 'default',
			name: 'Daily Deed Tracker',
			description: 'Daily check-in reminders and announcements',
			importance: 4, // IMPORTANCE_HIGH
			visibility: 1, // VISIBILITY_PUBLIC
			vibration: true
		});
	}

	const { receive } = await PushNotifications.requestPermissions();
	if (receive !== 'granted') {
		console.warn('[nativePush] permission not granted');
		return;
	}

	// Token received from APNs (iOS) or FCM (Android)
	await PushNotifications.addListener('registration', async ({ value: token }) => {
		try {
			const res = await fetch(`${base}/api/push/native-register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, platform, deviceId: getDeviceId() })
			});
			if (!res.ok) console.error('[nativePush] token registration failed:', res.status);
		} catch (e) {
			console.error('[nativePush] token registration error:', e?.message);
		}
	});

	await PushNotifications.addListener('registrationError', ({ error }) => {
		console.error('[nativePush] registration error:', error);
	});

	// Foreground: notification arrives while app is open — log it (silent by default)
	await PushNotifications.addListener('pushNotificationReceived', (notification) => {
		console.log('[nativePush] foreground notification:', notification.title);
	});

	// Tap on a notification — navigate to the linked URL if provided
	await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
		const url = notification.data?.url;
		if (!url) return;
		if (url.startsWith('/')) goto(url);
		else window.location.href = url;
	});

	await PushNotifications.register();
}
