<script>
	import { createEventDispatcher } from 'svelte';
	export let prayer; // { id, name, sunnah }
	export let record = { jamath: false, sunnah: false };
	const dispatch = createEventDispatcher();
</script>

<div class="prayer" class:done={record.jamath && record.sunnah}>
	<div class="meta">
		<span class="name">{prayer.name}</span>
		<span class="hint">Sunnah: {prayer.sunnah}</span>
	</div>
	<div class="toggles">
		<button
			class="pill"
			class:on={record.jamath}
			aria-pressed={record.jamath}
			on:click={() => dispatch('toggle', { field: 'jamath' })}
		>
			<span class="dot" />
			Jamāʻah
		</button>
		<button
			class="pill alt"
			class:on={record.sunnah}
			aria-pressed={record.sunnah}
			on:click={() => dispatch('toggle', { field: 'sunnah' })}
		>
			<span class="dot" />
			Sunnah
		</button>
	</div>
</div>

<style>
	.prayer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 13px 14px;
		border-bottom: 1px solid var(--border);
	}
	.prayer:last-child {
		border-bottom: none;
	}
	.prayer.done .name {
		color: var(--green);
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.name {
		font-weight: 700;
		font-size: 1.02rem;
	}
	.hint {
		font-size: 0.74rem;
		color: var(--text-faint);
	}
	.toggles {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 8px 12px;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		transition: all 0.18s ease;
	}
	.pill .dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid var(--text-faint);
		transition: all 0.18s ease;
	}
	.pill.on {
		color: #042f2a;
		background: var(--teal);
		border-color: var(--teal);
	}
	.pill.alt.on {
		color: #2a1e05;
		background: var(--gold);
		border-color: var(--gold);
	}
	.pill.on .dot {
		background: #042f2a;
		border-color: #042f2a;
	}
	.pill.alt.on .dot {
		background: #2a1e05;
		border-color: #2a1e05;
	}
	.pill:active {
		transform: scale(0.96);
	}
	@media (max-width: 480px) {
		.hint {
			display: none;
		}
		.pill {
			padding: 8px 10px;
		}
	}
</style>
