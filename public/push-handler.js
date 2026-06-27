// Push notification handlers — imported into the Workbox-generated service worker via importScripts.
// This file must use only vanilla JS (no ES module imports).

self.addEventListener('push', function (event) {
	if (!event.data) return;
	var payload;
	try {
		payload = event.data.json();
	} catch (e) {
		payload = { title: 'Daily Tracker', body: event.data.text() };
	}
	var title = payload.title || 'Daily Tracker';
	var body = payload.body || '';
	var url = payload.url || '/';
	event.waitUntil(
		self.registration.showNotification(title, {
			body: body,
			icon: '/icon-192.png',
			badge: '/icon-192.png',
			data: { url: url }
		})
	);
});

self.addEventListener('notificationclick', function (event) {
	event.notification.close();
	var target = (event.notification.data && event.notification.data.url) || '/';
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (wins) {
			var match = wins.find(function (w) {
				return w.url.includes(self.location.origin);
			});
			if (match) return match.focus();
			return clients.openWindow(target);
		})
	);
});
