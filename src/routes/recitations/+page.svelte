<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { RECITATIONS } from '$lib/recitations.js';
	import ImmersiveBg from '$lib/components/ImmersiveBg.svelte';

	let active = 0; // index into RECITATIONS

	const VARIANTS = 10; // number of distinct ambient animations / combos
	let variant = 0; // which one is showing now
	let hue = 210; // randomised colour, refreshed on load and each switch

	$: item = RECITATIONS[active];

	// Pick a fresh random animation + colour, never the same one twice in a row.
	function pickVariant() {
		let v = variant;
		while (v === variant) v = Math.floor(Math.random() * VARIANTS);
		variant = v;
		let h = hue;
		while (Math.abs(h - hue) < 40) h = Math.floor(Math.random() * 360);
		hue = h;
	}

	onMount(() => {
		variant = Math.floor(Math.random() * VARIANTS);
		hue = Math.floor(Math.random() * 360);
	});

	function go(dir) {
		active = (active + dir + RECITATIONS.length) % RECITATIONS.length;
		pickVariant();
	}

	function select(i) {
		active = i;
		pickVariant();
	}

	// horizontal swipe to switch recitation
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
	}
</script>

<svelte:head><title>Recitations</title></svelte:head>
<svelte:window on:keydown={onKey} />

<div
	class="screen"
	style="--hue:{hue}"
	role="application"
	aria-label="Protective recitations"
	on:touchstart={touchStart}
	on:touchend={touchEnd}
>
	<header class="bar">
		<button class="icon" on:click={() => goto(`${base}/`)} aria-label="back" title="Back">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
		</button>
		<div class="label">
			<p class="tr">{item.tr}</p>
			<p class="en">{item.subtitle}</p>
		</div>
		<span class="spacer"></span>
	</header>

	<div class="stage">
		<button class="arrow left" on:click={() => go(-1)} aria-label="previous recitation">‹</button>

		<div class="reader">
			<!-- ambient background animation (decorative) -->
			<ImmersiveBg {variant} />

			<!-- recitation card — Arabic only, centred to fill the screen -->
			<article class="recite">
				{#if item.bismillah}
					<p class="bismillah" dir="rtl" lang="ar">{item.bismillah}</p>
				{/if}
				<div class="verses" dir="rtl" lang="ar">
					{#each item.verses as v, i}
						<p class="ayah">
							<span class="text">{v}</span>
							{#if item.verses.length > 1}<span class="num">{i + 1}</span>{/if}
						</p>
					{/each}
				</div>
			</article>
		</div>

		<button class="arrow right" on:click={() => go(1)} aria-label="next recitation">›</button>
	</div>

	<div class="dots" role="tablist" aria-label="select recitation">
		{#each RECITATIONS as r, i}
			<button
				class="dot"
				class:on={i === active}
				role="tab"
				on:click={() => select(i)}
				aria-label={r.tr}
				aria-selected={i === active}
			></button>
		{/each}
	</div>
</div>

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
	@media (hover: hover) {
		.icon:hover { background: rgba(255, 255, 255, 0.16); }
	}
	.icon:active { background: rgba(255, 255, 255, 0.16); }
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
	@media (hover: hover) {
		.arrow:hover { color: #fff; }
	}
	.arrow:active { color: #fff; }

	/* ---- reader: card over an ambient animated backdrop ---- */
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
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.4rem;
		padding: 0.5rem 0.25rem;
	}

	.bismillah {
		margin: 0;
		font-size: clamp(1.35rem, 5.8vw, 1.8rem);
		opacity: 0.85;
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.5);
	}
	.verses {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin: 0.15rem 0;
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
		background: transparent;
	}

	.dots {
		display: flex;
		gap: 0.6rem;
		padding: 0.5rem 0 calc(env(safe-area-inset-bottom, 0px) + 1.5rem);
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

	@media (prefers-reduced-motion: reduce) {
		.screen { transition: none; }
	}
</style>
