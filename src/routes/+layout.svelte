<script>
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { user, checkSession } from '$lib/auth.js';
	import { settings, applyTheme } from '$lib/settings.js';

	let ready = false;

	// Keepalive: while logged in, re-sync the session every 10 min and whenever the
	// tab becomes visible. Each /api/auth/me call refreshes the rotated session id
	// and slides the cookie's 30-day expiry, so an idle tab never drifts into logout.
	const KEEPALIVE_MS = 10 * 60 * 1000;
	let keepaliveTimer = null;

	function pingIfVisible() {
		if ($user && document.visibilityState === 'visible') checkSession();
	}

	onMount(async () => {
		await checkSession();
		ready = true;
		document.addEventListener('visibilitychange', pingIfVisible);
		keepaliveTimer = setInterval(pingIfVisible, KEEPALIVE_MS);
	});

	onDestroy(() => {
		if (!browser) return;
		if (keepaliveTimer) clearInterval(keepaliveTimer);
		document.removeEventListener('visibilitychange', pingIfVisible);
	});

	// Keep <html data-theme> in sync once settings load / change.
	$: if (browser) applyTheme($settings.theme);

	$: path = $page.url.pathname.replace(base, '') || '/';
	$: isLogin = path === '/login';

	// Redirect rules once the session check has resolved.
	$: if (ready && $user === null && !isLogin) goto(`${base}/login`);
	$: if (ready && $user && isLogin) goto(`${base}/`);
</script>

{#if !ready}
	<div class="boot"><span class="spinner" /></div>
{:else if isLogin || $user}
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
