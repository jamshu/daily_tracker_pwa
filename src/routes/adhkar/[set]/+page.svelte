<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { ADHKAR } from '$lib/adhkar.js';
	import ImmersiveBg from '$lib/components/ImmersiveBg.svelte';

	$: set = $page.params.set;
	$: coll = ADHKAR[set];
	$: items = coll?.items ?? [];

	let active = 0;
	let showDetails = false;

	const VARIANTS = 10;
	let variant = 0;
	let hue = 35; // random colour per screen

	$: item = items[active];

	// redirect if someone lands on an unsupported set
	onMount(() => {
		if (!coll || !items.length) {
			goto(`${base}/`);
			return;
		}
		variant = Math.floor(Math.random() * VARIANTS);
		hue = Math.floor(Math.random() * 360);
	});

	function pickVariant() {
		let v = variant;
		while (v === variant) v = Math.floor(Math.random() * VARIANTS);
		variant = v;
		// fresh colour, kept clearly different from the current one
		let h = hue;
		while (Math.abs(h - hue) < 40) h = Math.floor(Math.random() * 360);
		hue = h;
	}

	function go(dir) {
		active = (active + dir + items.length) % items.length;
		showDetails = false;
		pickVariant();
	}

	function select(i) {
		active = i;
		showDetails = false;
		pickVariant();
	}

	let startX = null;
	function touchStart(e) {
		startX = e.changedTouches[0].clientX;
	}
	function touchEnd(e) {
		if (startX == null) return;
		const dx = e.changedTouches[0].clientX - startX;
		if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
		startX = null;
	}

	function onKey(e) {
		if (e.key === 'ArrowLeft') go(-1);
		else if (e.key === 'ArrowRight') go(1);
		else if (e.key === 'Escape') goto(`${base}/`);
	}
</script>

<svelte:head><title>{coll?.title ?? 'Adhkār'}</title></svelte:head>
<svelte:window on:keydown={onKey} />

{#if coll && item}
	<div
		class="screen"
		style="--hue:{hue}"
		role="application"
		aria-label={coll.title}
		on:touchstart={touchStart}
		on:touchend={touchEnd}
	>
		<header class="bar">
			<button class="icon" on:click={() => goto(`${base}/`)} aria-label="back" title="Back">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
			</button>
			<div class="label">
				<p class="tr">{coll.title}</p>
				<p class="en">{coll.subtitle}</p>
			</div>
			<span class="spacer"></span>
		</header>

		<div class="stage">
			<button class="arrow left" on:click={() => go(-1)} aria-label="previous">‹</button>

			<div class="reader">
				<ImmersiveBg {variant} />

				<!-- one dhikr per screen — Arabic + count, tap to reveal details -->
				<article class="recite" on:click={() => (showDetails = !showDetails)} role="button" tabindex="0" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (showDetails = !showDetails)}>
					<span class="count">{item.count}</span>
					{#if item.bismillah}<p class="bismillah" dir="rtl" lang="ar">{item.bismillah}</p>{/if}
					{#if item.verses}
						<div class="verses" dir="rtl" lang="ar">
							{#each item.verses as v, i}
								<p class="ayah">
									<span class="text">{v}</span>
									{#if item.verses.length > 1}<span class="num">{i + 1}</span>{/if}
								</p>
							{/each}
						</div>
					{:else}
						<p class="ayah" dir="rtl" lang="ar">{item.ar}</p>
					{/if}

					{#if showDetails}
						<div class="details">
							{#if item.tr}<p class="tr">{item.tr}</p>{/if}
							{#if item.en}<p class="en">{item.en}</p>{/if}
							{#if item.reward}
								<p class="reward">
									<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
										<path d="M12 2l2.6 5.6L20.5 8.4l-4.3 4 1 6L12 15.8 6.8 18.4l1-6-4.3-4 5.9-.8L12 2z" />
									</svg>
									<span>{item.reward}</span>
								</p>
							{/if}
							{#if item.source}<p class="src">{item.source}</p>{/if}
						</div>
					{:else}
						<span class="hint-tap">tap for details</span>
					{/if}
				</article>
			</div>

			<button class="arrow right" on:click={() => go(1)} aria-label="next">›</button>
		</div>

		<div class="dots" role="tablist" aria-label="select dhikr">
			{#each items as _, i}
				<button
					class="dot"
					class:on={i === active}
					role="tab"
					on:click={() => select(i)}
					aria-label={`Dhikr ${i + 1}`}
					aria-selected={i === active}
				></button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.screen {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: #f3f4f6;
		background:
			radial-gradient(120% 80% at 50% 0%, hsl(var(--hue) 55% 22%) 0%, transparent 60%),
			linear-gradient(180deg, hsl(var(--hue) 40% 10%) 0%, #07080c 70%);
		overflow: hidden;
		touch-action: pan-y;
		user-select: none;
		-webkit-user-select: none;
		transition: background 0.6s ease;
	}

	.bar {
		width: 100%;
		max-width: 560px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1.25rem 0.5rem;
	}
	.icon {
		flex: none;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
		color: inherit;
		cursor: pointer;
	}
	.icon:hover { background: rgba(255, 255, 255, 0.16); }
	.label { flex: 1; text-align: center; }
	.label .tr { margin: 0; font-weight: 600; font-size: 1.05rem; }
	.label .en { margin: 0.1rem 0 0; font-size: 0.8rem; opacity: 0.65; }
	.spacer { flex: none; width: 40px; }

	.stage {
		flex: 1;
		width: 100%;
		max-width: 560px;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0 0.75rem;
	}

	.arrow {
		flex: none;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: rgba(255, 255, 255, 0.55);
		font-size: 2rem;
		line-height: 1;
		cursor: pointer;
	}
	.arrow:hover { color: #fff; }

	.reader {
		position: relative;
		flex: 1;
		min-width: 0;
		height: 100%;
		display: grid;
		place-items: center;
		padding: 0.5rem 0;
	}

	.recite {
		position: relative;
		z-index: 1;
		width: 100%;
		max-height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.6rem;
		padding: 0.5rem 0.25rem;
		overflow-y: auto;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.count {
		flex: none;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: hsl(var(--hue) 85% 75%);
		background: hsl(var(--hue) 70% 50% / 0.18);
		border: 1px solid hsl(var(--hue) 70% 60% / 0.35);
		padding: 0.2rem 0.7rem;
		border-radius: 999px;
	}

	.bismillah {
		margin: 0;
		font-size: clamp(1.2rem, 5vw, 1.6rem);
		opacity: 0.85;
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.5);
	}
	.verses {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}
	.ayah {
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		font-size: clamp(1.6rem, 6.8vw, 2.3rem);
		font-weight: 600;
		line-height: 1.85;
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55);
	}
	.ayah .num {
		flex: none;
		font-size: 0.9rem;
		font-weight: 600;
		opacity: 0.5;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 36ch;
		margin-top: 0.2rem;
		animation: fade 0.25s ease;
	}
	.details .tr {
		margin: 0;
		font-size: 0.95rem;
		font-style: italic;
		opacity: 0.85;
	}
	.details .en {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.6;
		opacity: 0.9;
	}
	.details .reward {
		margin: 0;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		line-height: 1.5;
		color: hsl(var(--hue) 85% 78%);
	}
	.details .reward svg { flex: none; margin-top: 0.15rem; }
	.details .src {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.55;
	}

	.hint-tap {
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
	}

	.dots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.6rem;
		padding: 0.5rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1.5rem);
	}
	.dot {
		width: 9px;
		height: 9px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.25);
		cursor: pointer;
		transition: background 0.2s, transform 0.2s;
	}
	.dot.on {
		background: hsl(var(--hue) 85% 65%);
		transform: scale(1.3);
	}

	@keyframes fade {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@media (prefers-reduced-motion: reduce) {
		.screen { transition: none; }
		.details { animation: none; }
	}
</style>
