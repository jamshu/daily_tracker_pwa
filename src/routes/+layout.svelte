<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { user, checkSession } from '$lib/auth.js';

	let ready = false;

	onMount(async () => {
		await checkSession();
		ready = true;
	});

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
