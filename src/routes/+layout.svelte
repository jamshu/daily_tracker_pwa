<script>
	import '@fontsource-variable/fraunces/full.css';
	import '@fontsource-variable/fraunces/full-italic.css';
	import '@fontsource-variable/inter/index.css';
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { user, checkSession } from '$lib/auth.js';
	import { settings, applyTheme } from '$lib/settings.js';
	import { pushSupported, subscribePush, registerSW } from '$lib/push.js';
	import { initNativePush } from '$lib/nativePush.js';
	import { get } from 'svelte/store';

	let ready = false;
	let pushAttempted = false;
	let backBtnHandle = null;
	let isNative = false; // set by initNative(); gates VAPID vs FCM push path

	// Native (Capacitor) shell init: status bar, splash hide, Android back button.
	// All guarded by isNativePlatform() so the web/PWA build is a no-op.
	async function initNative() {
		const { Capacitor } = await import('@capacitor/core');
		if (!Capacitor.isNativePlatform()) return;
		isNative = true;
		try {
			const { StatusBar, Style } = await import('@capacitor/status-bar');
			await StatusBar.setStyle({ style: Style.Dark }); // light text on dark theme
			if (Capacitor.getPlatform() === 'android') {
				await StatusBar.setBackgroundColor({ color: '#0b1120' });
			}
		} catch {}
		try {
			const { App: CapApp } = await import('@capacitor/app');
			backBtnHandle = await CapApp.addListener('backButton', ({ canGoBack }) => {
				if (canGoBack) window.history.back();
				else CapApp.exitApp();
			});
		} catch {}
		try {
			const { SplashScreen } = await import('@capacitor/splash-screen');
			await SplashScreen.hide();
		} catch {}
	}

	// Keepalive: while logged in, re-sync the session every 10 min and whenever the
	// tab becomes visible. Each /api/auth/me call refreshes the rotated session id
	// and slides the cookie's 30-day expiry, so an idle tab never drifts into logout.
	const KEEPALIVE_MS = 10 * 60 * 1000;
	let keepaliveTimer = null;

	function pingIfVisible() {
		if ($user && document.visibilityState === 'visible') checkSession();
	}

	function armGestureSubscribe() {
		// Browsers only show the permission prompt from a user gesture. When permission
		// is still 'default', defer to the first tap. CRITICAL for iOS Safari: the call
		// to Notification.requestPermission() must happen synchronously inside the gesture
		// BEFORE any await, or iOS drops the user-activation and suppresses the prompt.
		const handler = () => {
			window.removeEventListener('pointerdown', handler);
			let req;
			try {
				req = Notification.requestPermission();
			} catch (e) {
				return;
			}
			Promise.resolve(req).then((perm) => {
				if (perm === 'granted') runPushSubscribe();
			});
		};
		window.addEventListener('pointerdown', handler, { once: true });
	}

	function tryPushSubscribe() {
		// On native (Capacitor), FCM handles push — VAPID/SW path is skipped entirely
		if (isNative) return;
		if (pushAttempted) return;
		if (!pushSupported()) return;
		if (Notification.permission === 'denied') return;
		if (Notification.permission === 'granted') runPushSubscribe();
		else armGestureSubscribe();
	}

	async function runPushSubscribe() {
		if (pushAttempted) return;
		pushAttempted = true;
		try {
			await registerSW();
			// Always (re)subscribe + save to backend. pushManager.subscribe is idempotent
			// when the VAPID key matches (returns the existing browser sub, no new prompt),
			// and the subscribe endpoint upserts by deviceId — so this re-creates the Odoo
			// row even if it was deleted server-side while the browser sub still exists.
			await subscribePush();
		} catch (e) {
			pushAttempted = false;
		}
	}

	onMount(async () => {
		await initNative(); // await so isNative flag is set before checkSession resolves
		await checkSession();
		ready = true;
		document.addEventListener('visibilitychange', pingIfVisible);
		keepaliveTimer = setInterval(pingIfVisible, KEEPALIVE_MS);
		// Try after initial session check (handles already-logged-in case)
		if (get(user)) {
			if (isNative) initNativePush();
			else tryPushSubscribe();
		}
	});

	onDestroy(() => {
		if (!browser) return;
		if (keepaliveTimer) clearInterval(keepaliveTimer);
		document.removeEventListener('visibilitychange', pingIfVisible);
		backBtnHandle?.remove?.();
	});

	// Keep <html data-theme> in sync once settings load / change.
	$: if (browser) applyTheme($settings.theme);

	// Subscribe to user store to catch login event (fires when $user goes undefined → object)
	user.subscribe((u) => {
		if (browser && u) {
			if (isNative) initNativePush();
			else tryPushSubscribe();
		}
	});

	$: path = $page.url.pathname.replace(base, '') || '/';
	$: isPublic = path === '/login' || path === '/privacy';

	// Redirect rules once the session check has resolved.
	$: if (ready && $user === null && !isPublic) goto(`${base}/login`);
	$: if (ready && $user && path === '/login') goto(`${base}/`);
</script>

{#if !ready}
	<div class="boot"><span class="spinner" /></div>
{:else if isPublic || $user}
	<slot />
{:else}
	<div class="boot"><span class="spinner" /></div>
{/if}

<style>
	.boot {
		min-height: 100dvh;
		display: grid;
		place-items: center;
	}
	.spinner {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 3px solid var(--border);
		border-top-color: var(--teal);
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
