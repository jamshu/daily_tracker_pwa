import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('push', (event) => {
	let payload = {};
	if (event.data) {
		try {
			payload = event.data.json();
		} catch {
			payload = { body: event.data.text() };
		}
	}
	const { title = 'Daily Tracker', body = 'Test notification', url = '/' } = payload;
	event.waitUntil(
		self.registration.showNotification(title, {
			body,
			icon: '/icon-192.png',
			badge: '/icon-192.png',
			data: { url }
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const target = event.notification.data?.url || '/';
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
			const match = wins.find((w) => w.url.includes(self.location.origin));
			if (match) return match.focus();
			return clients.openWindow(target);
		})
	);
});
