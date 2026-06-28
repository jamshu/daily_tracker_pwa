<script>
	// Decorative ambient backdrop. Hue comes from inherited --hue on an ancestor.
	export let variant = 0;
</script>

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

<style>
	/* decorative animation layer fills its positioned parent, behind the card */
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

	@media (prefers-reduced-motion: reduce) {
		.anim, .anim > * { animation: none !important; }
		.bloom { transform: scale(1); }
	}
</style>
