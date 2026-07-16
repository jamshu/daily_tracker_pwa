// Daily "log your day" reminder via Capacitor Local Notifications.
// Web build: no-op (browsers can't schedule notifications while the app is closed).
const REMINDER_ID = 1;

/** timeStr: "HH:MM" | null (null cancels). Re-assert on every app open. */
export async function syncReminder(timeStr) {
	const { Capacitor } = await import('@capacitor/core');
	if (!Capacitor.isNativePlatform()) return;
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
