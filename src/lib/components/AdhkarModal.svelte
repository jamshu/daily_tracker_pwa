<script>
	import { adhkarView, closeAdhkar, ADHKAR } from '$lib/adhkar.js';

	let gender = 'male';
	$: data = $adhkarView ? ADHKAR[$adhkarView] : null;
	$: if ($adhkarView) gender = 'male';
	$: tabItems = data?.tabs ? data.tabs[gender].items : [];
	$: allItems = data ? [...(data.items ?? []), ...tabItems] : [];

	function onKey(e) {
		if (e.key === 'Escape') closeAdhkar();
	}
</script>

<svelte:window on:keydown={onKey} />

{#if data}
	<div class="backdrop" on:click={closeAdhkar} role="presentation">
		<div class="sheet" role="dialog" aria-modal="true" on:click|stopPropagation>
			<header>
				<div class="titles">
					<h2>{data.title}</h2>
					<p>{data.subtitle}</p>
				</div>
				<button class="x" on:click={closeAdhkar} aria-label="close">×</button>
			</header>

			{#if data.tabs}
				<div class="tabs">
					{#each Object.entries(data.tabs) as [key, tab]}
						<button class="tab" class:active={gender === key} on:click={() => gender = key}>
							{tab.label}
						</button>
					{/each}
				</div>
			{/if}

			<div class="list">
				{#each allItems as it, i}
					<article class="item">
						<div class="top">
							<span class="num">{i + 1}</span>
							<span class="count">{it.count}</span>
						</div>
						<p class="ar" dir="rtl" lang="ar">{it.ar}</p>
						{#if it.tr}<p class="tr">{it.tr}</p>{/if}
						<p class="en">{it.en}</p>
						<p class="reward">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
								<path d="M12 2l2.6 5.6L20.5 8.4l-4.3 4 1 6L12 15.8 6.8 18.4l1-6-4.3-4 5.9-.8L12 2z" />
							</svg>
							<span>{it.reward}</span>
						</p>
						<p class="src">{it.source}</p>
					</article>
				{/each}
				<p class="footnote">
					Recite sincerely and unhurriedly. Counts and rewards follow the well-known
					authentic narrations.
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 80;
		background: rgba(2, 6, 16, 0.62);
		backdrop-filter: blur(3px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		animation: fade 0.2s ease;
	}
	.sheet {
		width: 100%;
		max-width: 560px;
		max-height: 88vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, var(--surface-2), var(--surface));
		border: 1px solid var(--border);
		border-bottom: none;
		border-radius: 22px 22px 0 0;
		box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.5);
		animation: slideup 0.32s cubic-bezier(0.18, 1, 0.4, 1);
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 18px 18px 12px;
		border-bottom: 1px solid var(--border);
	}
	.titles h2 {
		font-size: 1.15rem;
		font-weight: 800;
	}
	.titles p {
		margin: 3px 0 0;
		font-size: 0.8rem;
		color: var(--text-dim);
	}
	.x {
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.x:hover {
		color: var(--text);
	}
	.tabs {
		display: flex;
		gap: 8px;
		padding: 10px 16px;
		border-bottom: 1px solid var(--border);
		background: var(--surface-2);
	}
	.tab {
		flex: 1;
		padding: 7px 0;
		border-radius: 8px;
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	.tab.active {
		background: var(--teal);
		border-color: var(--teal);
		color: #042f2a;
	}
	.list {
		overflow-y: auto;
		padding: 14px 16px calc(24px + env(safe-area-inset-bottom, 0px));
		display: flex;
		flex-direction: column;
		gap: 12px;
		-webkit-overflow-scrolling: touch;
	}
	.item {
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 14px;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}
	.num {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
	}
	.count {
		font-size: 0.72rem;
		font-weight: 700;
		color: #042f2a;
		background: var(--gold);
		padding: 3px 9px;
		border-radius: 999px;
	}
	.ar {
		margin: 0;
		font-size: 1.4rem;
		line-height: 2.1;
		font-weight: 600;
		color: var(--text);
		text-align: right;
	}
	.tr {
		margin: 8px 0 0;
		font-size: 0.84rem;
		font-style: italic;
		color: var(--teal);
	}
	.en {
		margin: 6px 0 0;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--text-dim);
	}
	.reward {
		display: flex;
		gap: 7px;
		align-items: flex-start;
		margin: 10px 0 0;
		padding-top: 10px;
		border-top: 1px solid var(--border);
		font-size: 0.84rem;
		line-height: 1.45;
		color: var(--text);
	}
	.reward svg {
		flex-shrink: 0;
		margin-top: 3px;
		color: var(--gold);
	}
	.src {
		margin: 6px 0 0;
		font-size: 0.74rem;
		font-weight: 600;
		color: var(--text-faint);
	}
	.footnote {
		text-align: center;
		font-size: 0.76rem;
		color: var(--text-faint);
		margin: 4px 0 0;
	}
	@keyframes slideup {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
