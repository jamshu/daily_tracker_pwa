<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { DHIKR, counts, loadCounts, increment, reset } from '$lib/mindfulness.js';

	let active = 0; // index into DHIKR
	let pulse = false; // brief scale-pulse on each tap
	let confirmReset = false; // reset button two-step confirm
	let resetTimer = null;

	const VARIANTS = 5; // number of distinct breathing animations
	let variant = 0; // which one is showing now

	$: dhikr = DHIKR[active];
	$: count = $counts[dhikr.id] || 0;

	// Pick a fresh random animation, never the same one twice in a row.
	function pickVariant() {
		let v = variant;
		while (v === variant) v = Math.floor(Math.random() * VARIANTS);
		variant = v;
	}

	onMount(() => {
		loadCounts();
		variant = Math.floor(Math.random() * VARIANTS);
	});

	function tap() {
		increment(dhikr.id);
		pulse = false;
		// retrigger the pulse animation
		requestAnimationFrame(() => (pulse = true));
	}

	function go(dir) {
		active = (active + dir + DHIKR.length) % DHIKR.length;
		pickVariant();
		cancelConfirm();
	}

	function selectDhikr(i) {
		active = i;
		pickVariant();
		cancelConfirm();
	}

	function doReset() {
		if (!confirmReset) {
			confirmReset = true;
			resetTimer = setTimeout(cancelConfirm, 2500);
			return;
		}
		reset(dhikr.id);
		cancelConfirm();
	}

	function cancelConfirm() {
		confirmReset = false;
		clearTimeout(resetTimer);
	}

	// horizontal swipe to switch dhikr
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

<svelte:head><title>Mindfulness · Dhikr</title></svelte:head>
<svelte:window on:keydown={onKey} />

<div
	class="screen"
	style="--hue:{dhikr.hue}"
	role="application"
	aria-label="Dhikr counter"
	on:touchstart={touchStart}
	on:touchend={touchEnd}
>
	<header class="bar">
		<button class="icon" on:click={() => goto(`${base}/`)} aria-label="back" title="Back">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
		</button>
		<div class="label">
			<p class="tr">{dhikr.tr}</p>
			<p class="en">{dhikr.en}</p>
		</div>
		<span class="spacer"></span>
	</header>

	<div class="stage">
		<button class="arrow left" on:click={() => go(-1)} aria-label="previous dhikr">‹</button>

		<button class="flower v{variant}" class:pulse on:click={tap} on:animationend={() => (pulse = false)} aria-label="add count">
			{#if variant === 0}
				<!-- bloom: rotating petals -->
				<span class="anim bloom">
					{#each Array(6) as _, i}
						<span class="petal" style="--r:{i * 60}deg"></span>
					{/each}
				</span>
			{:else if variant === 1}
				<!-- rings: concentric pulses -->
				<span class="anim rings">
					{#each Array(4) as _, i}
						<span class="ring" style="--d:{i * 0.7}s"></span>
					{/each}
				</span>
			{:else if variant === 2}
				<!-- orbit: dots circling a breathing core -->
				<span class="anim orbit">
					<span class="halo"></span>
					{#each Array(8) as _, i}
						<span class="sat" style="--r:{i * 45}deg"></span>
					{/each}
				</span>
			{:else if variant === 3}
				<!-- ripple: expanding fading waves -->
				<span class="anim ripple">
					{#each Array(3) as _, i}
						<span class="wave" style="--d:{i * 2.4}s"></span>
					{/each}
				</span>
			{:else}
				<!-- glow: single soft pulsing orb -->
				<span class="anim glow"><span class="orb"></span></span>
			{/if}
			<span class="core">
				<span class="ar" dir="rtl" lang="ar">{dhikr.ar}</span>
				<span class="count">{count}</span>
				<span class="plus">+</span>
			</span>
		</button>

		<button class="arrow right" on:click={() => go(1)} aria-label="next dhikr">›</button>
	</div>

	<div class="dots" role="tablist" aria-label="select dhikr">
		{#each DHIKR as d, i}
			<button
				class="dot"
				class:on={i === active}
				role="tab"
				on:click={() => selectDhikr(i)}
				aria-label={d.tr}
				aria-selected={i === active}
			></button>
		{/each}
	</div>

	<button class="reset" class:confirm={confirmReset} on:click={doReset}>
		{confirmReset ? 'Tap again to reset' : 'Reset'}
	</button>
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
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0 1rem;
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

	/* ---- breathing flower (also the giant + tap target) ---- */
	.flower {
		position: relative;
		flex: 1;
		max-width: 360px;
		aspect-ratio: 1;
		border: none;
		background: transparent;
		color: inherit;
		cursor: pointer;
		display: grid;
		place-items: center;
	}
	/* each variant lives in a full-size animated layer behind .core */
	.anim {
		position: absolute;
		inset: 0;
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

	/* 0 — bloom: rotating petals, big swell */
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

	/* 1 — rings: concentric circles pulsing outward */
	.rings .ring {
		width: 100%;
		height: 100%;
		border: 2px solid hsl(var(--hue) 85% 62% / 0.5);
		background: hsl(var(--hue) 85% 60% / 0.06);
		animation: ringPulse 4s ease-in-out infinite;
		animation-delay: var(--d);
	}
	@keyframes ringPulse {
		0%, 100% { transform: scale(0.35); opacity: 0.2; }
		50% { transform: scale(1.25); opacity: 0.9; }
	}

	/* 2 — orbit: satellites circling a breathing halo */
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
	@keyframes spin { to { transform: rotate(360deg); } }
	@keyframes breathe2 {
		0%, 100% { transform: scale(0.7); }
		50% { transform: scale(1.3); }
	}

	/* 3 — ripple: expanding fading waves */
	.ripple .wave {
		width: 100%;
		height: 100%;
		border: 2px solid hsl(var(--hue) 85% 62% / 0.5);
		animation: rippleOut 7.2s ease-in-out infinite;
		animation-delay: var(--d);
	}
	@keyframes rippleOut {
		0% { transform: scale(0.2); opacity: 0; }
		20% { opacity: 0.8; }
		100% { transform: scale(1.35); opacity: 0; }
	}

	/* 4 — glow: single soft orb, large pulse */
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

	.flower.pulse .core { animation: pop 0.25s ease; }
	@keyframes pop {
		0% { transform: scale(1); }
		40% { transform: scale(1.12); }
		100% { transform: scale(1); }
	}

	.core {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-align: center;
	}
	.core .ar {
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.4;
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.5);
	}
	.core .count {
		font-size: 3.4rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.core .plus {
		font-size: 1.1rem;
		opacity: 0.6;
		line-height: 1;
	}

	.dots {
		display: flex;
		gap: 0.6rem;
		padding: 0.5rem 0;
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

	.reset {
		margin: 0.5rem 0 calc(env(safe-area-inset-bottom, 0px) + 1.75rem);
		padding: 0.6rem 1.4rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		color: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;
	}
	.reset:hover { background: rgba(255, 255, 255, 0.12); }
	.reset.confirm {
		border-color: hsl(var(--hue) 85% 60%);
		background: hsl(var(--hue) 70% 45% / 0.35);
	}

	@media (prefers-reduced-motion: reduce) {
		.anim, .anim > * { animation: none !important; }
		.bloom { transform: scale(1); }
		.flower.pulse .core { animation: none; }
		.screen { transition: none; }
	}
</style>
