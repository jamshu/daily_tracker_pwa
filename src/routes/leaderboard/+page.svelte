<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { global, globalState, loadGlobal } from '$lib/leaderboard.js';
	import {
		myGroups,
		invites,
		loadGroups,
		createGroup,
		respondInvite,
		leaveGroup
	} from '$lib/groups.js';

	let tab = 'groups'; // 'groups' | 'global'
	let newName = '';
	let creating = false;
	let busyId = null; // memberId being responded to
	let err = '';

	onMount(() => {
		loadGlobal();
		loadGroups();
	});

	async function create() {
		const name = newName.trim();
		if (!name) return;
		creating = true;
		err = '';
		try {
			const id = await createGroup(name);
			newName = '';
			goto(`${base}/leaderboard/${id}`);
		} catch (e) {
			err = e?.message || 'Could not create group';
		} finally {
			creating = false;
		}
	}

	async function respond(memberId, accept) {
		busyId = memberId;
		err = '';
		try {
			await respondInvite(memberId, accept);
		} catch (e) {
			err = e?.message || 'Could not respond';
		} finally {
			busyId = null;
		}
	}

	async function leave(id, name) {
		if (!confirm(`Leave "${name}"? If you are the owner this deletes the group.`)) return;
		err = '';
		try {
			await leaveGroup(id);
		} catch (e) {
			err = e?.message || 'Could not leave';
		}
	}

	function medal(rank) {
		return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
	}
</script>

<svelte:head><title>Leaderboard · Daily Tracker</title></svelte:head>

<div class="app">
	<header>
		<button class="back" on:click={() => goto(`${base}/`)} aria-label="back">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
		</button>
		<h1>Leaderboard</h1>
	</header>

	<div class="tabs">
		<button class:active={tab === 'groups'} on:click={() => (tab = 'groups')}>
			Groups
			{#if $invites.length}<span class="dot">{$invites.length}</span>{/if}
		</button>
		<button class:active={tab === 'global'} on:click={() => (tab = 'global')}>Global</button>
	</div>

	{#if err}<p class="err">{err}</p>{/if}

	{#if tab === 'global'}
		{#if $globalState === 'loading' && !$global}
			<div class="card empty">Loading…</div>
		{:else if $global && !$global.shareGlobal}
			<div class="card empty">
				<p>You're not sharing your score yet.</p>
				<button class="primary" on:click={() => goto(`${base}/settings`)}>Enable in Settings</button>
			</div>
		{:else if $global}
			<p class="note">
				{#if $global.myRank}Your rank: <strong>#{$global.myRank}</strong> · {/if}Today's score (out of 100).
			</p>
			{#if $global.rows.length}
				<div class="card list">
					<div class="row head">
						<span class="rank">#</span>
						<span class="name">Name</span>
						<span class="score">Score</span>
					</div>
					{#each $global.rows as r (r.rank)}
						<div class="row" class:me={r.isMe}>
							<span class="rank">{medal(r.rank) || `#${r.rank}`}</span>
							<span class="name">{r.name}{#if r.isMe}<span class="you"> (you)</span>{/if}</span>
							<span class="score">{r.score}</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="card empty">No one is sharing scores yet.</div>
			{/if}
		{/if}
	{:else}
		<!-- Invites (notifications) -->
		{#if $invites.length}
			<h2 class="section-title">Invitations</h2>
			<div class="card list">
				{#each $invites as inv (inv.memberId)}
					<div class="row invite">
						<span class="name">
							<strong>{inv.groupName}</strong>
							<span class="sub">from {inv.invitedByName}</span>
						</span>
						<span class="acts">
							<button class="mini ok" disabled={busyId === inv.memberId} on:click={() => respond(inv.memberId, true)}>Allow</button>
							<button class="mini" disabled={busyId === inv.memberId} on:click={() => respond(inv.memberId, false)}>Decline</button>
						</span>
					</div>
				{/each}
			</div>
		{/if}

		<h2 class="section-title">Create a group</h2>
		<div class="card create">
			<input placeholder="Group name" bind:value={newName} maxlength="60" on:keydown={(e) => e.key === 'Enter' && create()} />
			<button class="primary" disabled={creating || !newName.trim()} on:click={create}>Create</button>
		</div>

		<h2 class="section-title">My groups</h2>
		{#if $myGroups.length}
			<div class="card list">
				{#each $myGroups as g (g.id)}
					<div class="row group">
						<button class="name link" on:click={() => goto(`${base}/leaderboard/${g.id}`)}>
							<strong>{g.name}</strong>
							<span class="sub">{g.memberCount} member{g.memberCount === 1 ? '' : 's'}{g.isOwner ? ' · owner' : ''}</span>
						</button>
						<button class="mini" on:click={() => leave(g.id, g.name)}>{g.isOwner ? 'Delete' : 'Leave'}</button>
					</div>
				{/each}
			</div>
		{:else}
			<div class="card empty">No groups yet. Create one above.</div>
		{/if}
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
	.back:hover {
		background: var(--surface-2);
	}
	h1 {
		font-size: 1.6rem;
		font-variation-settings: 'SOFT' 50;
		letter-spacing: -0.02em;
	}
	.tabs {
		display: flex;
		gap: 6px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 4px;
		margin-bottom: 14px;
	}
	.tabs button {
		flex: 1;
		height: 38px;
		border-radius: 999px;
		font-weight: 700;
		font-size: 0.92rem;
		color: var(--text-dim);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}
	.tabs button.active {
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--green));
	}
	.dot {
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 999px;
		background: var(--red);
		color: #fff;
		font-size: 0.7rem;
		display: inline-grid;
		place-items: center;
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
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.12rem;
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
	.name strong {
		font-family: var(--font-display);
		font-size: 1.08rem;
		font-weight: 600;
		font-variation-settings: 'SOFT' 40;
		letter-spacing: -0.01em;
	}
	.name.link {
		background: transparent;
		color: var(--text);
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
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.05rem;
		font-variant-numeric: tabular-nums;
		color: var(--teal);
		padding: 4px 11px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--teal) 12%, transparent);
	}
	.acts {
		display: flex;
		gap: 6px;
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
	.create {
		display: flex;
		gap: 8px;
		padding: 12px;
	}
	.create input {
		flex: 1;
		height: 44px;
		padding: 0 12px;
		border-radius: var(--radius-sm);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		color: var(--text);
		font-size: 0.95rem;
	}
	.create input:focus {
		outline: none;
		border-color: var(--teal);
	}
	.primary {
		height: 44px;
		padding: 0 18px;
		border-radius: var(--radius-sm);
		font-weight: 700;
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--green));
	}
	.primary:disabled {
		opacity: 0.6;
	}
	.empty {
		padding: 24px;
		text-align: center;
		color: var(--text-faint);
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
	}
	.note {
		margin: 0 0 12px;
		font-size: 0.9rem;
		color: var(--text-dim);
	}
	.err {
		margin: 0 0 12px;
		color: var(--red);
		font-size: 0.9rem;
	}
</style>
