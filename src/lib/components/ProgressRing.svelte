<script>
	export let value = 0; // 0..1
	export let size = 168;
	export let stroke = 14;

	$: radius = (size - stroke) / 2;
	$: circ = 2 * Math.PI * radius;
	$: score = Math.round(value * 100);
	$: offset = circ * (1 - value);
	$: tone = value >= 1 ? 'var(--green)' : value >= 0.5 ? 'var(--teal)' : 'var(--gold)';
</script>

<div class="ring" style="width:{size}px;height:{size}px">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="var(--border)"
			stroke-width={stroke}
		/>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={tone}
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={circ}
			stroke-dashoffset={offset}
			transform="rotate(-90 {size / 2} {size / 2})"
		/>
	</svg>
	<div class="label">
		<span class="pct">{score}<small>/100</small></span>
		<span class="sub">score</span>
	</div>
</div>

<style>
	.ring {
		position: relative;
		display: grid;
		place-items: center;
	}
	circle {
		transition: stroke-dashoffset 0.55s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.3s ease;
	}
	.label {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
	}
	.pct {
		font-size: 2.4rem;
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.03em;
	}
	.pct small {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-dim);
		margin-left: 1px;
	}
	.sub {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--text-faint);
	}
</style>
