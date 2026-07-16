// Daily "log your day" reminder.
//   Native (Capacitor): OS-scheduled local notification — fires even when the app
//     is fully closed.
//   Web/PWA: no backend, so we can't schedule while fully closed. Instead a page
//     scheduler fires the notification while the installed PWA is running (incl.
//     minimized/backgrounded) and catches up on next foreground if the time passed.
// `dateKey` is imported lazily inside the web path so this module's top level stays
// free of browser-only deps (keeps `dueToFire` unit-testable under node).

const REMINDER_ID = 1;

/** timeStr: "HH:MM" | null (null cancels). Re-assert on every app open. */
export async function syncReminder(timeStr) {
	const { Capacitor } = await import('@capacitor/core');
	if (Capacitor.isNativePlatform()) return syncNativeReminder(timeStr);
	return scheduleWebReminder(timeStr);
}

/* --------------------------------- native -------------------------------- */

async function syncNativeReminder(timeStr) {
	try {
		const { LocalNotifications } = await import('@capacitor/local-notifications');
		await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {});
		if (!timeStr) return;
		const perm = await LocalNotifications.requestPermissions();
		if (perm.display !== 'granted') return;
		const [hour, minute] = timeStr.split(':').map(Number);
		await LocalNotifications.schedule({
			notifications: [
				{
					id: REMINDER_ID,
					title: 'Daily Tracker',
					body: "Time to log today's prayers and deeds",
					schedule: { on: { hour, minute }, allowWhileIdle: true }
				}
			]
		});
	} catch (e) {
		console.error('[notify] reminder sync failed:', e?.message);
	}
}

/* ----------------------------------- web --------------------------------- */

const LAST_SHOWN_KEY = 'reminder:lastShown';
const TICK_MS = 30000;

let tickTimer = null;
let onVisible = null;

/**
 * Pure scheduling decision — no browser deps, so it's unit-testable.
 * Fire when a time is set, `now` is at/after today's HH:MM, and we haven't
 * already shown today's reminder.
 */
export function dueToFire(now, timeStr, lastShownKey, todayKey) {
	if (!timeStr) return false;
	const m = /^(\d{2}):(\d{2})$/.exec(timeStr);
	if (!m) return false;
	if (lastShownKey === todayKey) return false;
	const target = new Date(now);
	target.setHours(Number(m[1]), Number(m[2]), 0, 0);
	return now >= target;
}

async function scheduleWebReminder(timeStr) {
	if (typeof window === 'undefined' || !('Notification' in window)) return; // e.g. iOS Safari
	// Tear down any previous scheduler so re-syncs don't stack.
	clearInterval(tickTimer);
	tickTimer = null;
	if (onVisible) {
		document.removeEventListener('visibilitychange', onVisible);
		onVisible = null;
	}
	if (!timeStr) return; // reminder turned off

	if (Notification.permission === 'default') {
		try {
			await Notification.requestPermission();
		} catch {
			/* ignore */
		}
	}
	if (Notification.permission !== 'granted') return;

	const { dateKey } = await import('./store.js');
	const tick = () => {
		let lastShown = null;
		try {
			lastShown = localStorage.getItem(LAST_SHOWN_KEY);
		} catch {
			/* ignore */
		}
		const today = dateKey();
		if (!dueToFire(new Date(), timeStr, lastShown, today)) return;
		showReminder();
		try {
			localStorage.setItem(LAST_SHOWN_KEY, today);
		} catch {
			/* ignore */
		}
	};

	tick(); // catch-up if the app opened after the time passed
	tickTimer = setInterval(tick, TICK_MS);
	onVisible = () => {
		if (document.visibilityState === 'visible') tick();
	};
	document.addEventListener('visibilitychange', onVisible);
}

async function showReminder() {
	const title = 'Daily Tracker';
	const opts = {
		body: "Time to log today's prayers and deeds",
		tag: 'daily-reminder', // dedupes if one is already showing
		icon: '/icon-192.png',
		badge: '/icon-192.png'
	};
	try {
		const reg = await navigator.serviceWorker?.getRegistration?.();
		if (reg?.showNotification) {
			await reg.showNotification(title, opts);
			return;
		}
	} catch {
		/* fall through to page notification (e.g. dev, no SW) */
	}
	try {
		new Notification(title, opts);
	} catch {
		/* permission revoked between check and fire — ignore */
	}
}
