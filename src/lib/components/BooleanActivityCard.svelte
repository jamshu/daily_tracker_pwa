<script>
	import { createEventDispatcher } from 'svelte';
	export let activity; // { id, name, emoji }
	export let done = false; // per-day done/not-done
	const dispatch = createEventDispatcher();
</script>

<div class="bcard card" class:done>
	<button class="main" aria-pressed={done} on:click={() => dispatch('toggle')}>
		<span class="check">
			{#if done}
				<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
					<path d="M20 6 9 17l-5-5" />
				</svg>
			{/if}
		</span>
		<span class="name">{#if activity.emoji}<span class="emo" aria-hidden="true">{activity.emoji}</span>{/if}{activity.name}</span>
	</button>
	<button class="del" on:click={() => dispatch('delete')} aria-label={`remove ${activity.name}`}>×</button>
</div>

<style>
	.bcard {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 12px 12px 14px;
	}
	.main {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		text-align: left;
		min-width: 0;
		transition: opacity 0.15s ease;
	}
	.main:active {
		opacity: 0.7;
	}
	.check {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		border: 2px solid var(--text-faint);
		color: var(--on-green);
		transition: all 0.18s ease;
	}
	.bcard.done .check {
		background: var(--green);
		border-color: var(--green);
	}
	.bcard.done .check svg {
		animation: pop 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	@keyframes pop {
		0% { transform: scale(0.4); }
		60% { transform: scale(1.18); }
		100% { transform: scale(1); }
	}
	@media (prefers-reduced-motion: reduce) {
		.bcard.done .check svg {
			animation: none;
		}
	}
	.name {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.12rem;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		letter-spacing: -0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.name .emo {
		font-size: 1.02rem;
		margin-right: 9px;
	}
	.bcard.done .name {
		color: var(--green);
	}
	.del {
		flex: 0 0 auto;
		width: 24px;
		height: 24px;
		border-radius: 7px;
		font-size: 1.1rem;
		line-height: 1;
		color: var(--text-faint);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	@media (hover: hover) {
		.del:hover {
			color: var(--red, #ef4444);
		}
	}
</style>
