<script>
	import '@fontsource-variable/fraunces/full.css';
	import '@fontsource-variable/fraunces/full-italic.css';
	import '@fontsource-variable/inter/index.css';
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { settings, applyTheme, loadSettings } from '$lib/settings.js';
	import { openWelcome } from '$lib/welcome.js';
	import WelcomeModal from '$lib/components/WelcomeModal.svelte';
	import { syncReminder } from '$lib/notify.js';
	import * as localdb from '$lib/localdb.js';
	import { get } from 'svelte/store';

	let ready = false;
	let backBtnHandle = null;

	// Register the PWA service worker so the app loads offline. Prod build only
	// (dev serves no sw.js). Deliberately independent of Capacitor — this must
	// run for every web/PWA visit, not be gated behind the native shim import.
	function registerServiceWorker() {
		if (import.meta.env.PROD && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
	}

	// Native (Capacitor) shell init: status bar, splash hide, Android back button.
	// All guarded by isNativePlatform() so the web build is a no-op.
	async function initNative() {
		const { Capacitor } = await import('@capacitor/core');
		if (!Capacitor.isNativePlatform()) return;
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

	onMount(async () => {
		registerServiceWorker();
		await initNative();
		await localdb.init();
		await loadSettings();
		ready = true;
		// First run — no name stored yet: ask for it.
		if (!get(settings).name) openWelcome();
		// Re-assert the daily reminder on every app open (survives reboots/updates).
		syncReminder(get(settings).reminderTime);
	});

	onDestroy(() => {
		if (!browser) return;
		backBtnHandle?.remove?.();
	});

	// Keep <html data-theme> in sync once settings load / change.
	$: if (browser) applyTheme($settings.theme);
</script>

{#if ready}
	<slot />
	<WelcomeModal />
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
