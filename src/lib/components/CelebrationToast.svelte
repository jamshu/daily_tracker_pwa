<script>
	import { toast, dismissToast } from '$lib/toast.js';

	const COLORS = ['#14b8a6', '#d6a64a', '#34d399', '#f59e0b', '#22d3ee', '#a78bfa', '#fb7185'];

	let confetti = [];
	let balloons = [];
	let lastId = null;

	// Regenerate the particles whenever a new toast appears.
	$: if ($toast && $toast.id !== lastId) {
		lastId = $toast.id;
		confetti = Array.from({ length: 70 }, (_, i) => ({
			id: i,
			left: Math.random() * 100,
			delay: Math.random() * 0.35,
			dur: 1.8 + Math.random() * 1.6,
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			rot: (Math.random() * 6 - 3) * 360,
			drift: (Math.random() - 0.5) * 320,
			size: 6 + Math.random() * 8,
			round: Math.random() > 0.6
		}));
		balloons = Array.from({ length: 6 }, (_, i) => ({
			id: i,
			left: 6 + Math.random() * 88,
			delay: Math.random() * 0.4,
			dur: 3 + Math.random() * 1.8,
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			sway: (Math.random() - 0.5) * 80
		}));
	}
</script>

{#if $toast}
	{#key $toast.id}
		<div class="layer">
			<div class="field" aria-hidden="true">
				{#each confetti as c (c.id)}
					<span
						class="piece"
						class:round={c.round}
						style="left:{c.left}%; width:{c.size}px; height:{c.size}px; background:{c.color}; --delay:{c.delay}s; --dur:{c.dur}s; --rot:{c.rot}deg; --drift:{c.drift}px"
					/>
				{/each}
				{#each balloons as b (b.id)}
					<span
						class="balloon"
						style="left:{b.left}%; background:{b.color}; --delay:{b.delay}s; --dur:{b.dur}s; --sway:{b.sway}px"
					/>
				{/each}
			</div>

			<div
				class="toast card"
				role="status"
				tabindex="0"
				on:click={dismissToast}
				on:keydown={(e) => (e.key === 'Enter' || e.key === 'Escape') && dismissToast()}
			>
				<span class="badge">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 2l2.6 5.6L20.5 8.4l-4.3 4 1 6L12 15.8 6.8 18.4l1-6-4.3-4 5.9-.8L12 2z" />
					</svg>
				</span>
				<div class="body">
					<p class="title">{$toast.title}</p>
					<p class="quote">{$toast.quote}</p>
					<p class="source">— {$toast.source}</p>
				</div>
			</div>
		</div>
	{/key}
{/if}

<style>
	.layer {
		position: fixed;
		inset: 0;
		z-index: 70;
		pointer-events: none;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 18px 16px;
	}
	.field {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
	.piece {
		position: absolute;
		top: -24px;
		border-radius: 2px;
		opacity: 0;
		animation: fall var(--dur) var(--delay) cubic-bezier(0.3, 0.5, 0.6, 1) forwards;
	}
	.piece.round {
		border-radius: 50%;
	}
	@keyframes fall {
		0% {
			transform: translate3d(0, -24px, 0) rotate(0deg);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		100% {
			transform: translate3d(var(--drift), 105vh, 0) rotate(var(--rot));
			opacity: 0;
		}
	}
	.balloon {
		position: absolute;
		bottom: -130px;
		width: 30px;
		height: 38px;
		border-radius: 50% 50% 50% 50% / 55% 55% 45% 45%;
		opacity: 0;
		box-shadow: inset -4px -5px 0 rgba(0, 0, 0, 0.12);
		animation: rise var(--dur) var(--delay) ease-in forwards;
	}
	.balloon::after {
		content: '';
		position: absolute;
		bottom: -9px;
		left: 50%;
		width: 1px;
		height: 11px;
		background: rgba(255, 255, 255, 0.45);
	}
	@keyframes rise {
		0% {
			transform: translate(0, 0);
			opacity: 0;
		}
		15% {
			opacity: 0.92;
		}
		90% {
			opacity: 0.92;
		}
		100% {
			transform: translate(var(--sway), -118vh);
			opacity: 0;
		}
	}
	.toast {
		pointer-events: auto;
		cursor: pointer;
		margin-top: 10px;
		max-width: 460px;
		width: 100%;
		display: flex;
		gap: 14px;
		padding: 16px 18px;
		border: 1px solid var(--border);
		background: linear-gradient(160deg, var(--surface-2), var(--surface));
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
		animation: pop 0.5s cubic-bezier(0.18, 1.3, 0.5, 1) both;
	}
	@keyframes pop {
		0% {
			transform: translateY(-18px) scale(0.92);
			opacity: 0;
		}
		60% {
			transform: translateY(0) scale(1.02);
		}
		100% {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}
	.badge {
		flex-shrink: 0;
		width: 42px;
		height: 42px;
		border-radius: 12px;
		display: grid;
		place-items: center;
		color: #2a1e05;
		background: linear-gradient(135deg, var(--gold), var(--teal));
		box-shadow: 0 0 0 4px rgba(214, 166, 74, 0.12);
		animation: badge 0.9s ease-in-out;
	}
	@keyframes badge {
		0%,
		100% {
			transform: rotate(0);
		}
		30% {
			transform: rotate(-12deg) scale(1.08);
		}
		60% {
			transform: rotate(10deg) scale(1.08);
		}
	}
	.body {
		min-width: 0;
	}
	.title {
		margin: 0 0 4px;
		font-size: 1rem;
		font-weight: 800;
		letter-spacing: -0.01em;
		color: var(--text);
	}
	.quote {
		margin: 0;
		font-size: 0.9rem;
		font-style: italic;
		line-height: 1.45;
		color: var(--text-dim);
	}
	.source {
		margin: 6px 0 0;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--teal);
	}
	@media (prefers-reduced-motion: reduce) {
		.field {
			display: none;
		}
		.toast {
			animation: fadein 0.25s ease both;
		}
		.badge {
			animation: none;
		}
		@keyframes fadein {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
	}
</style>
