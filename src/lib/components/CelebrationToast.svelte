<script>
	import { toast, dismissToast } from '$lib/toast.js';

	const COLORS = ['#14b8a6', '#d6a64a', '#34d399', '#f59e0b', '#22d3ee', '#a78bfa', '#fb7185', '#fcd34d'];

	let particles = [];
	let sparkles = [];
	let lastId = null;

	$: if ($toast && $toast.id !== lastId) {
		lastId = $toast.id;
		// Round confetti dots that burst radially outward.
		particles = Array.from({ length: 28 }, (_, i) => ({
			id: i,
			a: (i / 28) * 360 + (Math.random() * 16 - 8),
			r0: 84 + Math.random() * 10,
			r1: 175 + Math.random() * 110,
			size: 5 + Math.random() * 9,
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			dur: 0.4 + Math.random() * 0.25,
			delay: Math.random() * 0.05,
			round: Math.random() > 0.4
		}));
		// A few twinkling stars that pop near the circle edge.
		sparkles = Array.from({ length: 7 }, (_, i) => ({
			id: i,
			a: Math.random() * 360,
			r: 70 + Math.random() * 70,
			size: 12 + Math.random() * 10,
			delay: Math.random() * 0.12,
			color: COLORS[Math.floor(Math.random() * COLORS.length)]
		}));
	}
</script>

{#if $toast}
	{#key $toast.id}
		<div class="layer" on:click={dismissToast}>
			<div class="backdrop" />

			<div class="stage">
				<!-- expanding pulse rings behind the badge -->
				<span class="pulse" />
				<span class="pulse pulse2" />

				<!-- radial confetti dots -->
				{#each particles as p (p.id)}
					<span
						class="particle"
						class:round={p.round}
						style="
							--a: {p.a}deg;
							--r0: {p.r0}px;
							--r1: {p.r1}px;
							--dur: {p.dur}s;
							--delay: {p.delay}s;
							width: {p.size}px;
							height: {p.size}px;
							background: {p.color};
							box-shadow: 0 0 8px {p.color};
						"
					/>
				{/each}

				<!-- twinkling stars -->
				{#each sparkles as s (s.id)}
					<svg
						class="sparkle"
						viewBox="0 0 24 24"
						style="
							--a: {s.a}deg;
							--r: {s.r}px;
							--delay: {s.delay}s;
							width: {s.size}px;
							height: {s.size}px;
							color: {s.color};
							filter: drop-shadow(0 0 4px {s.color});
						"
					>
						<path
							fill="currentColor"
							d="M12 0l2.4 7.2L22 9.6l-6 4.8 2.4 7.6L12 17.6 5.6 22l2.4-7.6-6-4.8 7.6-2.4z"
						/>
					</svg>
				{/each}

				{#if $toast.message}
					<!-- motivation message (tasbeeh / dhikr set complete) -->
					<div class="cheer">{$toast.message}</div>
				{:else}
					<!-- score badge -->
					<div class="badge">
						<span class="ring" />
						<span class="score">+{$toast.points}</span>
					</div>
				{/if}
			</div>
		</div>
	{/key}
{/if}

<style>
	.layer {
		position: fixed;
		inset: 0;
		z-index: 70;
		pointer-events: auto;
		overflow: hidden;
		display: grid;
		place-items: center;
	}

	/* Soft radial darkening so the number reads on any background. */
	.backdrop {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at center,
			color-mix(in srgb, var(--gold, #d6a64a) 10%, transparent) 0%,
			rgba(0, 0, 0, 0.28) 40%,
			rgba(0, 0, 0, 0.12) 100%
		);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		animation: dim 1s ease-out forwards;
	}
	@keyframes dim {
		0% { opacity: 0; }
		18% { opacity: 1; }
		65% { opacity: 1; }
		100% { opacity: 0; }
	}

	.stage {
		position: relative;
		width: 0;
		height: 0;
	}

	/* expanding glow rings */
	.pulse {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 150px;
		height: 150px;
		border-radius: 50%;
		border: 2px solid color-mix(in srgb, var(--gold, #d6a64a) 55%, transparent);
		transform: translate(-50%, -50%) scale(0.4);
		opacity: 0;
		animation: pulse 0.7s 0.02s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
	.pulse2 {
		border-color: color-mix(in srgb, var(--green, #34d399) 50%, transparent);
		animation-delay: 0.1s;
	}
	@keyframes pulse {
		0% {
			transform: translate(-50%, -50%) scale(0.4);
			opacity: 0.9;
		}
		100% {
			transform: translate(-50%, -50%) scale(2.4);
			opacity: 0;
		}
	}

	.particle {
		position: absolute;
		top: 50%;
		left: 50%;
		border-radius: 2px;
		transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--r0)) scale(1);
		opacity: 0;
		animation: burst var(--dur) var(--delay) cubic-bezier(0.18, 0.9, 0.3, 1) forwards;
	}
	.particle.round {
		border-radius: 50%;
	}
	@keyframes burst {
		0% {
			transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--r0)) scale(0.6);
			opacity: 1;
		}
		70% {
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--r1)) scale(0.3);
			opacity: 0;
		}
	}

	.sparkle {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--r)) rotate(calc(-1 * var(--a)));
		opacity: 0;
		animation: twinkle 0.55s var(--delay) ease-out forwards;
	}
	@keyframes twinkle {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--r)) rotate(calc(-1 * var(--a))) scale(0.2);
		}
		40% {
			opacity: 1;
			transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--r)) rotate(calc(-1 * var(--a))) scale(1.15);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--r)) rotate(calc(-1 * var(--a))) scale(0.6);
		}
	}

	.badge {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 150px;
		height: 150px;
		transform: translate(-50%, -50%);
		display: grid;
		place-items: center;
		animation: popIn 0.32s cubic-bezier(0.16, 1.6, 0.3, 1) both;
	}

	.cheer {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		max-width: min(82vw, 320px);
		text-align: center;
		font-size: 1.5rem;
		font-weight: 900;
		line-height: 1.35;
		letter-spacing: -0.01em;
		color: #fcd34d;
		text-shadow: 0 0 16px rgba(252, 211, 77, 0.55), 0 0 32px rgba(245, 158, 11, 0.35),
			0 2px 8px rgba(0, 0, 0, 0.55);
		animation: popIn 0.34s cubic-bezier(0.16, 1.6, 0.3, 1) both;
	}

	/* gradient glowing ring */
	.ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		padding: 2.5px;
		background: conic-gradient(
			from 0deg,
			var(--gold, #d6a64a),
			var(--green, #34d399),
			#22d3ee,
			var(--gold, #d6a64a)
		);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		box-shadow:
			0 0 28px color-mix(in srgb, var(--gold, #d6a64a) 50%, transparent),
			inset 0 0 28px color-mix(in srgb, var(--gold, #d6a64a) 18%, transparent);
		animation: spin 3s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.score {
		font-size: 4.2rem;
		font-weight: 900;
		letter-spacing: -0.03em;
		line-height: 1;
		color: #f59e0b;
		text-shadow: 0 0 12px rgba(245, 158, 11, 0.45), 0 2px 8px rgba(0, 0, 0, 0.55);
		animation: numPop 0.34s cubic-bezier(0.16, 1.8, 0.3, 1) both;
	}

	@keyframes popIn {
		0% {
			transform: translate(-50%, -50%) scale(0.6);
			opacity: 0;
		}
		60% {
			transform: translate(-50%, -50%) scale(1.08);
		}
		100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
	}
	@keyframes numPop {
		0% { transform: scale(0.4); opacity: 0; }
		60% { transform: scale(1.15); }
		100% { transform: scale(1); opacity: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		.particle,
		.sparkle,
		.pulse {
			display: none;
		}
		.ring {
			animation: none;
		}
		.badge,
		.score,
		.cheer {
			animation: fadein 0.25s ease both;
		}
		@keyframes fadein {
			from { opacity: 0; }
			to { opacity: 1; }
		}
	}
</style>
