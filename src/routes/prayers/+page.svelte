<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { PRAYER_LIBRARY } from '$lib/adhkar.js';
	import LibraryLink from '$lib/components/LibraryLink.svelte';
</script>

<svelte:head><title>Prayers & Dhikr — Daily Deed Tracker</title></svelte:head>

<div class="wrap">
	<header class="bar">
		<button class="back" on:click={() => goto(`${base}/`)} aria-label="back">‹</button>
		<h1>Prayers & Dhikr</h1>
		<span class="spacer"></span>
	</header>

	<p class="intro fade-in">Prayers, adhkār and duas — tap any to open.</p>

	{#each PRAYER_LIBRARY as entry, i (entry.id)}
		<LibraryLink
			title={entry.title}
			subtitle={entry.subtitle}
			icon={entry.icon}
			fadeDelay={0.06 + i * 0.05}
			on:click={() => goto(`${base}${entry.href}`)}
		/>
	{/each}
</div>

<style>
	.wrap {
		max-width: var(--maxw, 560px);
		margin: 0 auto;
		padding: calc(12px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px))
			calc(48px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px));
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}
	.back {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		font-size: 1.6rem;
		line-height: 1;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.bar h1 {
		flex: 1;
		text-align: center;
		font-size: 1.2rem;
		font-weight: 800;
	}
	.spacer {
		width: 36px;
	}
	.intro {
		color: var(--text-dim);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
