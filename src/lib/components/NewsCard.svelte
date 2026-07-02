<script>
	import { news, relativeTime } from '$lib/news.js';

	let tab = 'BBC'; // 'BBC' | 'AJ'
	$: filtered = $news.articles.filter((a) => a.source === tab);
</script>

<div class="news card">
	<div class="head">
		<span class="badge">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z" />
				<path d="M2 7h2M2 12h2M2 17h2" />
				<path d="M9 7h6M9 12h6M9 17h4" />
			</svg>
		</span>
		<div class="titles">
			<strong>World News</strong>
			<small>Live feed</small>
		</div>
	</div>

	<div class="tabs" role="tablist">
		<button type="button" role="tab" class:active={tab === 'BBC'} aria-selected={tab === 'BBC'} on:click={() => (tab = 'BBC')}>BBC</button>
		<button type="button" role="tab" class:active={tab === 'AJ'}  aria-selected={tab === 'AJ'}  on:click={() => (tab = 'AJ')}>Al Jazeera</button>
	</div>

	{#if !$news.loaded}
		<div class="state">Loading headlines…</div>
	{:else if $news.error}
		<div class="state err">{$news.error}</div>
	{:else if !filtered.length}
		<div class="state">No headlines available</div>
	{:else}
		<ul class="list">
			{#each filtered as a, i}
				<li class="item">
					{#if a.thumb}
						<img class="thumb" src={a.thumb} alt="" loading={i < 3 ? 'eager' : 'lazy'} />
					{/if}
					<div class="content">
						<a class="title" href={a.link} target="_blank" rel="noopener">{a.title}</a>
						{#if a.description}
							<p class="desc">{a.description}</p>
						{/if}
						<span class="time">{relativeTime(a.pubDate)}</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.news {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.badge {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		border-radius: 11px;
		display: grid;
		place-items: center;
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--gold));
	}
	.titles {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.titles strong {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.12rem;
		letter-spacing: -0.01em;
	}
	.titles small {
		font-size: 0.76rem;
		color: var(--text-dim);
	}
	.src {
		flex-shrink: 0;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--teal);
		text-decoration: none;
		padding: 4px 8px;
		border-radius: 8px;
		border: 1px solid var(--border);
		transition: border-color 0.15s ease;
	}
	@media (hover: hover) {
		.src:hover {
			border-color: var(--teal);
		}
	}
	.state {
		padding: 22px 8px;
		text-align: center;
		font-size: 0.88rem;
		color: var(--text-faint);
	}
	.state.err {
		color: var(--red);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0 4px 0 0;
		display: flex;
		flex-direction: column;
		max-height: 320px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
	}
	.list::-webkit-scrollbar {
		width: 4px;
	}
	.list::-webkit-scrollbar-track {
		background: transparent;
	}
	.list::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 999px;
	}
	.item {
		display: flex;
		gap: 10px;
		padding: 10px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}
	.item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	.item:first-child {
		padding-top: 0;
	}
	.thumb {
		flex-shrink: 0;
		width: 60px;
		height: 46px;
		border-radius: 8px;
		object-fit: cover;
		background: var(--surface-2);
	}
	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.title {
		font-size: 0.85rem;
		font-weight: 600;
		line-height: 1.35;
		color: var(--text);
		text-decoration: none;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	@media (hover: hover) {
		.title:hover {
			color: var(--teal);
		}
	}
	.desc {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-dim);
		line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.tabs {
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: 999px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.tabs button {
		flex: 1;
		padding: 6px 6px;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-dim);
		transition: all 0.15s ease;
	}
	.tabs button.active {
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--teal-deep, var(--teal)));
	}
	.time {
		font-size: 0.7rem;
		color: var(--text-faint);
		margin-top: 2px;
	}
</style>
