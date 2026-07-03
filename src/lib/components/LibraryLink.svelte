<script>
	// Tappable library row: icon circle, title + subtitle, chevron.
	export let title;
	export let subtitle;
	export let icon = []; // SVG path `d` strings, 24×24 stroked viewBox
	export let fadeDelay = 0; // seconds, staggers the global fade-in
</script>

<button class="dhikr-link fade-in" style="--fade-delay:{fadeDelay}s" on:click>
	<span class="dl-icon">
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			{#each icon as d}
				<path {d} />
			{/each}
		</svg>
	</span>
	<span class="dl-text">
		<strong>{title}</strong>
		<small>{subtitle}</small>
	</span>
	<svg class="dl-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M9 18l6-6-6-6" />
	</svg>
</button>

<style>
	.dhikr-link {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 26px;
		padding: 13px 14px;
		border-radius: var(--radius);
		text-align: left;
		color: var(--text);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--teal) 16%, transparent),
			color-mix(in srgb, var(--gold) 12%, transparent)
		);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
		transition: all 0.15s ease;
	}
	@media (hover: hover) {
		.dhikr-link:hover {
			border-color: var(--teal);
			transform: translateY(-1px);
		}
	}
	.dhikr-link:active {
		transform: scale(0.99);
	}
	.dl-icon {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		border-radius: 11px;
		display: grid;
		place-items: center;
		color: var(--on-accent);
		background: linear-gradient(135deg, var(--teal), var(--gold));
	}
	.dl-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.dl-text strong {
		font-size: 0.98rem;
		font-weight: 700;
	}
	.dl-text small {
		font-size: 0.76rem;
		color: var(--text-dim);
	}
	.dl-chev {
		flex-shrink: 0;
		color: var(--text-faint);
	}
</style>
