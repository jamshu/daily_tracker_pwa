<script>
	// Legacy route. The app no longer has a login step (all data is on-device),
	// but some returning users still land on /login via old bookmarks, browser
	// autocomplete, or PWA history. Send them straight to the home screen.
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	onMount(() => {
		// replaceState so /login doesn't sit in history (back button skips it).
		goto(`${base}/`, { replaceState: true });
	});
</script>

<svelte:head><title>Daily Tracker</title></svelte:head>

<div class="redirect"><span class="spinner" aria-label="Loading" /></div>

<style>
	.redirect {
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
