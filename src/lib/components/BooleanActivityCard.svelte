<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	export let activity; // { id, name, emoji }
	export let done = false; // per-day done/not-done
	const dispatch = createEventDispatcher();

	// Two-tap delete: first tap arms a red "Confirm?" state that reverts after 3s
	// or on tapping anywhere else; second tap actually deletes.
	let confirmingDelete = false;
	let confirmTimer;
	function onDeleteTap() {
		if (confirmingDelete) {
			clearTimeout(confirmTimer);
			confirmingDelete = false;
			dispatch('delete');
			return;
		}
		confirmingDelete = true;
		confirmTimer = setTimeout(() => (confirmingDelete = false), 3000);
	}
	function cancelConfirm() {
		if (!confirmingDelete) return;
		clearTimeout(confirmTimer);
		confirmingDelete = false;
	}
	onDestroy(() => clearTimeout(confirmTimer));
</script>

<svelte:window on:click={cancelConfirm} />

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
	<button class="cfg" on:click|stopPropagation={() => dispatch('edit-goal')} aria-label={`edit goal for ${activity.name}`}>&#9881;&#65038;</button>
	<button
		class="del"
		class:confirm={confirmingDelete}
		on:click|stopPropagation={onDeleteTap}
		aria-label={confirmingDelete ? `confirm remove ${activity.name}` : `remove ${activity.name}`}
	>{confirmingDelete ? 'Confirm?' : '×'}</button>
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
	.cfg,
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
	.cfg {
		/* grid-center the gear glyph — iOS renders it with a baseline offset */
		display: grid;
		place-items: center;
		padding: 0;
		font-size: 0.85rem;
		line-height: 0;
	}
	@media (hover: hover) {
		.del:hover {
			color: var(--red, #ef4444);
		}
		.cfg:hover {
			color: var(--text);
		}
	}
	.del.confirm {
		width: auto;
		padding: 0 8px;
		font-size: 0.78rem;
		font-weight: 700;
		color: #fff;
		background: var(--red, #ef4444);
		border-color: var(--red, #ef4444);
	}
</style>
