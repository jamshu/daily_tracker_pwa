<script>
	export let value = 0; // 0..1
	export let size = 168;
	export let stroke = 14;

	$: radius = (size - stroke) / 2;
	$: circ = 2 * Math.PI * radius;
	$: score = Math.round(value * 100);
	$: offset = circ * (1 - value);
	// unique id so multiple rings (week strip etc.) don't share defs
	const uid = 'ring-' + Math.random().toString(36).slice(2, 8);
</script>

<div class="ring" style="width:{size}px;height:{size}px">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<defs>
			<linearGradient id="{uid}-grad" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="var(--gold)" />
				<stop offset="55%" stop-color="var(--teal)" />
				<stop offset="100%" stop-color="var(--green)" />
			</linearGradient>
			<filter id="{uid}-glow" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="4" result="b" />
				<feMerge>
					<feMergeNode in="b" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="var(--border)"
			stroke-width={stroke}
		/>
		<circle
			class="arc"
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="url(#{uid}-grad)"
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={circ}
			stroke-dashoffset={offset}
			filter="url(#{uid}-glow)"
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
	.arc {
		transition:
			stroke-dashoffset 0.65s cubic-bezier(0.22, 1, 0.36, 1);
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
		font-family: var(--font-display);
		font-size: 2.7rem;
		font-weight: 600;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		line-height: 1;
		letter-spacing: -0.03em;
	}
	.pct small {
		font-family: var(--font-body);
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-dim);
		margin-left: 2px;
		letter-spacing: 0;
	}
	.sub {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: var(--text-faint);
		margin-top: 3px;
	}
</style>
