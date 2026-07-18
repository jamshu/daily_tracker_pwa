// Custom service worker (injectManifest).
//
// Two jobs, both load-bearing:
//  1. Offline: precache the build and serve the cached app shell for any page
//     navigation that isn't an exact precache hit. Without the NavigationRoute
//     below, a cold launch with no network falls through to the network and
//     shows the browser's offline error — the exact bug we fixed earlier.
//  2. Web push: receive reminders sent by Odoo while the app is fully closed.
//     A generated (generateSW) worker cannot do this, which is why this file
//     is hand-written.

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Any page navigation that isn't an exact precache hit (hard reload, PWA
// launch, deep link) gets the cached shell, which then client-routes to the
// URL. The denylist keeps file requests (assets, manifest, sw.js) resolving to
// their own bytes instead of being handed HTML.
registerRoute(
	new NavigationRoute(createHandlerBoundToURL('/'), {
		denylist: [/\/[^/?]+\.[^/?]+$/]
	})
);

// --- Web push -------------------------------------------------------------
// Two payload shapes arrive here:
//   Odoo native: { title, options: { body, icon, data: { model, res_id } } }
//   Plain/app:   { title, body, url }
// Normalise both so either source renders identically.
self.addEventListener('push', (event) => {
	let payload = {};
	if (event.data) {
		try {
			payload = event.data.json();
		} catch {
			payload = { body: event.data.text() };
		}
	}

	const title = payload.title || 'Daily Tracker';
	const body = payload.body ?? payload.options?.body ?? '';
	const url = payload.url ?? payload.options?.data?.url ?? '/';

	event.waitUntil(
		self.registration.showNotification(title, {
			body,
			icon: '/icon-192.png',
			badge: '/icon-192.png',
			tag: 'daily-reminder', // collapse duplicates rather than stacking
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
			if (match) {
				match.focus();
				return match.navigate ? match.navigate(target).catch(() => {}) : undefined;
			}
			return clients.openWindow(target);
		})
	);
});
