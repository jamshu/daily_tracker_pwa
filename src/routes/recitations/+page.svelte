<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { RECITATIONS } from '$lib/recitations.js';

	let active = 0; // index into RECITATIONS

	const VARIANTS = 10; // number of distinct ambient animations / combos
	let variant = 0; // which one is showing now

	$: item = RECITATIONS[active];

	// Pick a fresh random animation, never the same one twice in a row.
	function pickVariant() {
		let v = variant;
		while (v === variant) v = Math.floor(Math.random() * VARIANTS);
		variant = v;
	}

	onMount(() => {
		variant = Math.floor(Math.random() * VARIANTS);
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
	style="--hue:{item.hue}"
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
			<span class="bg v{variant}" aria-hidden="true">
				{#if variant === 0}
					<span class="anim bloom">
						{#each Array(6) as _, i}
							<span class="petal" style="--r:{i * 60}deg"></span>
						{/each}
					</span>
				{:else if variant === 1}
					<span class="anim rings">
						{#each Array(4) as _, i}
							<span class="ring" style="--d:{i * 1.75}s"></span>
						{/each}
					</span>
				{:else if variant === 2}
					<span class="anim orbit">
						<span class="halo"></span>
						{#each Array(8) as _, i}
							<span class="sat" style="--r:{i * 45}deg"></span>
						{/each}
					</span>
				{:else if variant === 3}
					<span class="anim ripple">
						{#each Array(3) as _, i}
							<span class="wave" style="--d:{i * 2.4}s"></span>
						{/each}
					</span>
				{:else if variant === 4}
					<span class="anim glow"><span class="orb"></span></span>
				{:else if variant === 5}
					<span class="anim glow"><span class="orb"></span></span>
					<span class="anim bloom">
						{#each Array(6) as _, i}
							<span class="petal" style="--r:{i * 60}deg"></span>
						{/each}
					</span>
				{:else if variant === 6}
					<span class="anim rings">
						{#each Array(4) as _, i}
							<span class="ring" style="--d:{i * 1.75}s"></span>
						{/each}
					</span>
					<span class="anim orbit">
						<span class="halo"></span>
						{#each Array(8) as _, i}
							<span class="sat" style="--r:{i * 45}deg"></span>
						{/each}
					</span>
				{:else if variant === 7}
					<span class="anim glow"><span class="orb"></span></span>
					<span class="anim ripple">
						{#each Array(3) as _, i}
							<span class="wave" style="--d:{i * 2.4}s"></span>
						{/each}
					</span>
				{:else if variant === 8}
					<span class="anim orbit reverse">
						{#each Array(6) as _, i}
							<span class="sat" style="--r:{i * 60}deg"></span>
						{/each}
					</span>
					<span class="anim bloom">
						{#each Array(6) as _, i}
							<span class="petal" style="--r:{i * 60}deg"></span>
						{/each}
					</span>
				{:else if variant === 9}
					<span class="anim rings">
						{#each Array(3) as _, i}
							<span class="ring" style="--d:{i * 2.3}s"></span>
						{/each}
					</span>
					<span class="anim bloom">
						{#each Array(6) as _, i}
							<span class="petal" style="--r:{i * 60}deg"></span>
						{/each}
					</span>
				{:else}
					<span class="anim glow"><span class="orb"></span></span>
				{/if}
			</span>

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

	/* decorative animation layer fills the reader, behind the card */
	.bg {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
		opacity: 0.6;
	}
	.anim {
		position: absolute;
		width: min(360px, 92%);
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		pointer-events: none;
	}
	.anim > * {
		position: absolute;
		inset: 0;
		margin: auto;
		border-radius: 50%;
		mix-blend-mode: screen;
	}

	/* 0 — bloom */
	.bloom { animation: breathe 6s ease-in-out infinite; }
	.bloom .petal {
		width: 64%;
		height: 64%;
		background: hsl(var(--hue) 85% 60% / 0.34);
		transform: rotate(var(--r)) translateY(-30%);
		filter: blur(2px);
	}
	@keyframes breathe {
		0%, 100% { transform: scale(0.6) rotate(0deg); }
		50% { transform: scale(1.3) rotate(180deg); }
	}

	/* 1 — rings */
	.rings .ring {
		width: 100%;
		height: 100%;
		border: 2px solid hsl(var(--hue) 85% 62% / 0.5);
		background: hsl(var(--hue) 85% 60% / 0.06);
		animation: ringPulse 7s ease-in-out infinite;
		animation-delay: var(--d);
	}
	@keyframes ringPulse {
		0%, 100% { transform: scale(0.35); opacity: 0.15; }
		50% { transform: scale(1.25); opacity: 0.85; }
	}

	/* 2 — orbit */
	.orbit { animation: spin 14s linear infinite; }
	.orbit .halo {
		width: 55%;
		height: 55%;
		background: radial-gradient(circle, hsl(var(--hue) 85% 60% / 0.5), transparent 70%);
		animation: breathe2 5s ease-in-out infinite;
	}
	.orbit .sat {
		width: 16%;
		height: 16%;
		background: hsl(var(--hue) 90% 68% / 0.85);
		transform: rotate(var(--r)) translateY(-150%);
		filter: blur(1px);
	}
	.orbit.reverse { animation: spinRev 16s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	@keyframes spinRev { to { transform: rotate(-360deg); } }
	@keyframes breathe2 {
		0%, 100% { transform: scale(0.7); }
		50% { transform: scale(1.3); }
	}

	/* 3 — ripple */
	.ripple .wave {
		width: 100%;
		height: 100%;
		border: 2px solid hsl(var(--hue) 85% 62% / 0.5);
		animation: rippleOut 9s ease-out infinite;
		animation-delay: var(--d);
	}
	@keyframes rippleOut {
		0% { transform: scale(0.2); opacity: 0; }
		25% { opacity: 0.7; }
		60% { opacity: 0.5; }
		100% { transform: scale(1.4); opacity: 0; }
	}

	/* 4 — glow */
	.glow .orb {
		width: 70%;
		height: 70%;
		background: radial-gradient(circle, hsl(var(--hue) 90% 65% / 0.6), hsl(var(--hue) 85% 55% / 0.1) 70%, transparent);
		box-shadow: 0 0 80px hsl(var(--hue) 85% 55% / 0.5);
		animation: glowPulse 4.5s ease-in-out infinite;
	}
	@keyframes glowPulse {
		0%, 100% { transform: scale(0.55); opacity: 0.55; }
		50% { transform: scale(1.35); opacity: 1; }
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
		font-size: clamp(0.85rem, 3.6vw, 1rem);
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
		font-size: clamp(0.85rem, 3.8vw, 1.1rem);
		font-weight: 600;
		line-height: 1.85;
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55);
	}
	.ayah .num {
		flex: none;
		font-size: 0.62rem;
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
		.anim, .anim > * { animation: none !important; }
		.bloom { transform: scale(1); }
		.screen { transition: none; }
	}
</style>
