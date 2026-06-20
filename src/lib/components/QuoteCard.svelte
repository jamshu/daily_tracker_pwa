<script>
	import { onMount } from 'svelte';

	const API = 'https://dummyjson.com/quotes/random';

	// Shown if the API is unreachable (offline, blocked, rate-limited).
	const FALLBACK = [
		{ quote: 'The best among you are those who have the best manners and character.', author: 'Prophet Muhammad ﷺ' },
		{ quote: 'Take benefit of five before five: your health before your sickness, and your free time before your preoccupation.', author: 'Prophet Muhammad ﷺ' },
		{ quote: 'Verily, with hardship comes ease.', author: "Qur'an 94:6" },
		{ quote: 'Do small deeds consistently, for the most beloved deeds to Allah are the most consistent ones.', author: 'Prophet Muhammad ﷺ' },
		{ quote: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' }
	];

	let quote = '';
	let author = '';
	let loading = true;
	let key = 0; // bump to retrigger the fade animation

	async function load() {
		loading = true;
		try {
			const res = await fetch(API, { cache: 'no-store' });
			if (!res.ok) throw new Error('bad status');
			const data = await res.json();
			quote = data.quote;
			author = data.author;
		} catch {
			const f = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
			quote = f.quote;
			author = f.author;
		} finally {
			loading = false;
			key += 1;
		}
	}

	let copied = false;
	let copyTimer;

	async function copy() {
		if (!quote) return;
		const text = `"${quote}" — ${author}`;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// fallback for browsers / non-secure contexts without the Clipboard API
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			try {
				document.execCommand('copy');
			} catch {
				/* ignore */
			}
			document.body.removeChild(ta);
		}
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 1500);
	}

	onMount(load);
</script>

<section class="quote card fade-in">
	<svg class="mark" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
		<path d="M7.2 6C4.9 7.4 3.5 9.8 3.5 12.7c0 2.7 1.7 4.6 4 4.6 2 0 3.5-1.5 3.5-3.5 0-1.9-1.4-3.3-3.2-3.3-.4 0-.8.1-1 .2.3-1.4 1.4-2.7 2.9-3.6L7.2 6zm9 0c-2.3 1.4-3.7 3.8-3.7 6.7 0 2.7 1.7 4.6 4 4.6 2 0 3.5-1.5 3.5-3.5 0-1.9-1.4-3.3-3.2-3.3-.4 0-.8.1-1 .2.3-1.4 1.4-2.7 2.9-3.6L16.2 6z" />
	</svg>

	<div class="body">
		{#if loading && !quote}
			<p class="text shimmer">Loading a little motivation…</p>
		{:else}
			{#key key}
				<p class="text swap">{quote}</p>
				<p class="author swap">— {author}</p>
			{/key}
		{/if}
	</div>

	<div class="actions">
		<button
			class="iconbtn"
			class:done={copied}
			on:click={copy}
			disabled={loading || !quote}
			aria-label="copy quote"
			title={copied ? 'Copied!' : 'Copy quote'}
		>
			{#if copied}
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
					<path d="M20 6 9 17l-5-5" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="9" y="9" width="11" height="11" rx="2" />
					<path d="M5 15V5a2 2 0 0 1 2-2h10" />
				</svg>
			{/if}
		</button>
		<button class="iconbtn" on:click={load} disabled={loading} aria-label="new quote" title="New quote">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class:spin={loading}>
				<path d="M21 12a9 9 0 1 1-2.64-6.36" />
				<path d="M21 3v6h-6" />
			</svg>
		</button>
	</div>
</section>

<style>
	.quote {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 18px;
		margin-top: 14px;
	}
	.mark {
		flex-shrink: 0;
		color: var(--gold);
		margin-top: 2px;
		opacity: 0.85;
	}
	.body {
		flex: 1;
		min-width: 0;
	}
	.text {
		margin: 0;
		font-size: 1.02rem;
		font-weight: 600;
		line-height: 1.45;
		font-style: italic;
		color: var(--text);
	}
	.author {
		margin: 8px 0 0;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--teal);
	}
	.actions {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.iconbtn {
		width: 38px;
		height: 38px;
		border-radius: 11px;
		display: grid;
		place-items: center;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	.iconbtn:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-2);
	}
	.iconbtn:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.iconbtn.done {
		color: var(--green);
		border-color: var(--green);
	}
	.swap {
		animation: fade 0.4s ease both;
	}
	.shimmer {
		color: var(--text-faint);
	}
	.spin {
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
