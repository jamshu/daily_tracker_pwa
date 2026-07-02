<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { loadGroupBoard } from '$lib/leaderboard.js';
	import { searchUsers, inviteUser, removeMember, leaveGroup } from '$lib/groups.js';

	$: id = $page.params.id;

	let board = null; // { name, isOwner, rows, members }
	let state = 'loading'; // 'loading' | 'ok' | 'forbidden' | 'error'
	let err = '';

	// invite search
	let q = '';
	let results = [];
	let searching = false;
	let searchTimer;
	let invitedIds = new Set();

	async function load() {
		state = 'loading';
		try {
			board = await loadGroupBoard(id);
			state = 'ok';
		} catch (e) {
			state = e?.status === 403 ? 'forbidden' : 'error';
			err = e?.message || 'Could not load';
		}
	}

	onMount(load);

	function onSearch() {
		clearTimeout(searchTimer);
		const term = q.trim();
		if (term.length < 2) {
			results = [];
			return;
		}
		searchTimer = setTimeout(async () => {
			searching = true;
			try {
				results = await searchUsers(term);
			} catch {
				results = [];
			} finally {
				searching = false;
			}
		}, 300);
	}

	async function invite(u) {
		err = '';
		try {
			await inviteUser(Number(id), u.id);
			invitedIds = new Set(invitedIds).add(u.id);
			await load();
		} catch (e) {
			err = e?.message || 'Could not invite';
		}
	}

	async function kick(memberId) {
		err = '';
		try {
			await removeMember(memberId);
			await load();
		} catch (e) {
			err = e?.message || 'Could not remove';
		}
	}

	async function leave() {
		if (!confirm(board?.isOwner ? 'Delete this group?' : 'Leave this group?')) return;
		try {
			await leaveGroup(Number(id));
			goto(`${base}/leaderboard`);
		} catch (e) {
			err = e?.message || 'Could not leave';
		}
	}

	function medal(rank) {
		return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
	}
</script>

<svelte:head><title>{board?.name || 'Group'} · Daily Tracker</title></svelte:head>

<div class="app">
	<header>
		<button class="back" on:click={() => goto(`${base}/leaderboard`)} aria-label="back">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
		</button>
		<h1>{board?.name || 'Group'}</h1>
	</header>

	{#if err}<p class="err">{err}</p>{/if}

	{#if state === 'loading'}
		<div class="card empty">Loading…</div>
	{:else if state === 'forbidden'}
		<div class="card empty">You're not a member of this group.</div>
	{:else if state === 'error'}
		<div class="card empty">Couldn't load this group.</div>
	{:else if board}
		<p class="cap">Today's score (out of 100).</p>
		<div class="card list">
			<div class="row head">
				<span class="rank">#</span>
				<span class="name">Name</span>
				<span class="score">Score</span>
			</div>
			{#each board.rows as r, i (i)}
				<div class="row" class:me={r.isMe}>
					<span class="rank">{medal(r.rank) || `#${r.rank}`}</span>
					<span class="name">{r.name}{#if r.isMe}<span class="you"> (you)</span>{/if}</span>
					<span class="score">{r.score}</span>
				</div>
			{/each}
		</div>

		{#if board.isOwner}
			<h2 class="section-title">Invite people</h2>
			<div class="card">
				<input class="search" placeholder="Search by name or email" bind:value={q} on:input={onSearch} />
				{#if searching}<p class="hint">Searching…</p>{/if}
				{#if results.length}
					<div class="results">
						{#each results as u (u.id)}
							<div class="row">
								<span class="name"><strong>{u.name}</strong><span class="sub">{u.email}</span></span>
								<button class="mini ok" disabled={invitedIds.has(u.id)} on:click={() => invite(u)}>
									{invitedIds.has(u.id) ? 'Invited' : 'Invite'}
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<h2 class="section-title">Members</h2>
			<div class="card list">
				{#each board.members as m (m.memberId)}
					<div class="row">
						<span class="name">{m.name}<span class="sub">{m.isOwnerRow ? 'owner' : m.status}</span></span>
						{#if !m.isOwnerRow}
							<button class="mini" on:click={() => kick(m.memberId)}>Remove</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="actions">
			<button class="ghost" on:click={leave}>{board.isOwner ? 'Delete group' : 'Leave group'}</button>
		</div>
	{/if}
</div>

<style>
	.app {
		max-width: 560px;
		margin: 0 auto;
		padding: calc(20px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px))
			calc(64px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px));
	}
	header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 14px;
	}
	.back {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		display: grid;
		place-items: center;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
	}
	@media (hover: hover) {
		.back:hover {
			background: var(--surface-2);
		}
	}
	.back:active {
		background: var(--surface-2);
	}
	h1 {
		font-size: 1.3rem;
	}
	.list {
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 15px 18px;
		border-bottom: 1px solid var(--border);
	}
	.row:last-child {
		border-bottom: none;
	}
	.row.me {
		background: color-mix(in srgb, var(--teal) 14%, transparent);
	}
	/* Column header */
	.row.head {
		padding: 11px 18px;
		background: var(--bg-soft);
	}
	.row.head .rank,
	.row.head .name,
	.row.head .score {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-faint);
		background: none;
		padding: 0;
	}
	.rank {
		flex: 0 0 auto;
		min-width: 34px;
		font-weight: 800;
		font-size: 0.98rem;
		font-variant-numeric: tabular-nums;
		color: var(--text-dim);
	}
	.name {
		flex: 1;
		font-weight: 600;
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-align: left;
		min-width: 0;
	}
	.you {
		color: var(--teal);
		font-weight: 700;
	}
	.sub {
		font-size: 0.76rem;
		color: var(--text-faint);
		font-weight: 500;
	}
	.score {
		flex: 0 0 auto;
		font-weight: 800;
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
		color: var(--teal);
		padding: 4px 11px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--teal) 12%, transparent);
	}
	.search {
		width: 100%;
		height: 44px;
		padding: 0 12px;
		border-radius: var(--radius-sm);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		color: var(--text);
		/* 16px min — smaller makes iOS Safari auto-zoom on focus and stay zoomed. */
		font-size: 16px;
		margin-bottom: 8px;
	}
	.search:focus {
		outline: none;
		border-color: var(--teal);
	}
	.results {
		display: flex;
		flex-direction: column;
	}
	.hint {
		margin: 4px 2px;
		font-size: 0.8rem;
		color: var(--text-faint);
	}
	.mini {
		height: 32px;
		padding: 0 12px;
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 0.82rem;
		color: var(--text-dim);
		background: var(--surface);
		border: 1px solid var(--border);
	}
	.mini.ok {
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--green));
		border: none;
	}
	.mini:disabled {
		opacity: 0.6;
	}
	.empty {
		padding: 24px;
		text-align: center;
		color: var(--text-faint);
	}
	.actions {
		margin-top: 18px;
	}
	.ghost {
		width: 100%;
		height: 46px;
		border-radius: var(--radius-sm);
		font-weight: 700;
		color: var(--red);
		background: var(--surface);
		border: 1px solid var(--border);
	}
	.err {
		margin: 0 0 12px;
		color: var(--red);
		font-size: 0.9rem;
	}
	.cap {
		margin: 0 0 10px;
		font-size: 0.8rem;
		color: var(--text-faint);
	}
</style>
