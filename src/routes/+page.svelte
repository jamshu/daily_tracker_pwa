<script>
	import { onMount } from 'svelte';
	import { PRAYERS, ACTIVITIES, DEEDS, PRAYER_MARKS } from '$lib/config.js';
	import {
		currentDay,
		currentProgress,
		currentNotes,
		currentJournal,
		selectedDate,
		syncState,
		dateKey,
		shiftKey,
		togglePrayer,
		setActivity,
		toggleDeed,
		load
	} from '$lib/store.js';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import PrayerCard from '$lib/components/PrayerCard.svelte';
	import ActivityCard from '$lib/components/ActivityCard.svelte';
	import DeedToggle from '$lib/components/DeedToggle.svelte';
	import QuoteCard from '$lib/components/QuoteCard.svelte';
	import NotesCard from '$lib/components/NotesCard.svelte';
	import DateNav from '$lib/components/DateNav.svelte';
	import WeekStrip from '$lib/components/WeekStrip.svelte';
	import CelebrationToast from '$lib/components/CelebrationToast.svelte';
	import { celebrate } from '$lib/toast.js';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { user, logout } from '$lib/auth.js';

	const todayK = dateKey();

	onMount(load);

	async function doLogout() {
		await logout();
		goto(`${base}/login`);
	}

	const SYNC_LABEL = {
		loading: 'Loading…',
		saving: 'Saving…',
		saved: 'Saved',
		error: 'Offline',
		idle: ''
	};

	const greeting = (() => {
		const h = new Date().getHours();
		if (h < 5) return 'Peaceful night';
		if (h < 12) return 'Good morning';
		if (h < 17) return 'Good afternoon';
		if (h < 20) return 'Good evening';
		return 'Good night';
	})();

	// summary stats for the selected day (prayers, activities, deeds)
	$: prayerUnits = PRAYERS.reduce((n, p) => {
		const r = $currentDay.prayers[p.id] || {};
		return n + (r.jamath ? 1 : 0) + (p.hasSunnah && r.sunnah ? 1 : 0) + (r.dhikr ? 1 : 0);
	}, 0);
	$: activitiesMet = ACTIVITIES.filter(
		(a) => ($currentDay.activities[a.id] || 0) >= a.target
	).length;
	$: deedsDone = DEEDS.filter((d) => $currentDay.deeds?.[d.id]).length;

	$: message =
		$currentProgress >= 1
			? 'Maa shaa Allah — a complete day. Keep it up.'
			: $currentProgress >= 0.6
				? "You're well on your way. Finish strong."
				: $currentProgress > 0
					? 'Good start. One step at a time.'
					: 'A new day. Begin with Bismillah.';

	function prev() {
		selectedDate.update((k) => shiftKey(k, -1));
	}
	function next() {
		selectedDate.update((k) => (k >= todayK ? k : shiftKey(k, 1)));
	}
	function goToday() {
		selectedDate.set(todayK);
	}
	function pick(e) {
		selectedDate.set(e.detail.key);
	}

	// Toggle a prayer act; celebrate only when it's switched ON.
	function onPrayerToggle(prayer, field) {
		const wasOn = $currentDay.prayers[prayer.id]?.[field];
		togglePrayer($selectedDate, prayer.id, field);
		if (!wasOn) celebrate(field);
	}

	// Toggle a daily deed; celebrate when marked done.
	function onDeedToggle(deed) {
		const wasOn = $currentDay.deeds?.[deed.id];
		toggleDeed($selectedDate, deed.id);
		if (!wasOn) celebrate(deed.id);
	}

	// Set an activity value; celebrate the moment it reaches its target.
	function onActivitySet(activity, value) {
		const prev = $currentDay.activities[activity.id] || 0;
		setActivity($selectedDate, activity.id, value);
		if (prev < activity.target && value >= activity.target) celebrate(activity.id);
	}
</script>

<svelte:head>
	<title>Daily Tracker</title>
</svelte:head>

<div class="app">
	<header class="fade-in">
		<div class="brand">
			<span class="logo">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
				</svg>
			</span>
			<div class="brand-txt">
				<h1>Daily Tracker</h1>
				<span class="greet">{greeting}{#if $user?.name}, {$user.name}{/if}</span>
			</div>
			<div class="head-right">
				{#if SYNC_LABEL[$syncState]}
					<span class="sync {$syncState}">{SYNC_LABEL[$syncState]}</span>
				{/if}
				<button class="logout" on:click={doLogout} title="Sign out" aria-label="sign out">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
						<polyline points="16 17 21 12 16 7" />
						<line x1="21" y1="12" x2="9" y2="12" />
					</svg>
				</button>
			</div>
		</div>
		<DateNav dateK={$selectedDate} {todayK} on:prev={prev} on:next={next} on:today={goToday} />
	</header>

	<WeekStrip {todayK} selectedK={$selectedDate} on:pick={pick} />

	<section class="hero card fade-in">
		<ProgressRing value={$currentProgress} />
		<div class="hero-info">
			<p class="msg">{message}</p>
			<div class="stats">
				<div class="stat">
					<span class="big">{prayerUnits}<small>/{PRAYER_MARKS}</small></span>
					<span class="lbl">prayer marks</span>
				</div>
				<div class="stat">
					<span class="big">{activitiesMet}<small>/{ACTIVITIES.length}</small></span>
					<span class="lbl">goals met</span>
				</div>
				<div class="stat">
					<span class="big">{deedsDone}<small>/{DEEDS.length}</small></span>
					<span class="lbl">deeds done</span>
				</div>
			</div>
		</div>
	</section>

	<QuoteCard />

	<h2 class="section-title">Prayers · Jamāʻah, Sunnah &amp; Dhikr</h2>
	<div class="card">
		{#each PRAYERS as p (p.id)}
			<PrayerCard
				prayer={p}
				record={$currentDay.prayers[p.id]}
				on:toggle={(e) => onPrayerToggle(p, e.detail.field)}
			/>
		{/each}
	</div>

	<h2 class="section-title">Activities</h2>
	<div class="activities">
		{#each ACTIVITIES as a (a.id)}
			<ActivityCard
				activity={a}
				value={$currentDay.activities[a.id] || 0}
				on:set={(e) => onActivitySet(a, e.detail.value)}
			/>
		{/each}
	</div>

	<h2 class="section-title">Daily Deeds</h2>
	<div class="card">
		{#each DEEDS as d (d.id)}
			<DeedToggle
				deed={d}
				done={$currentDay.deeds?.[d.id] || false}
				on:toggle={() => onDeedToggle(d)}
			/>
		{/each}
	</div>

	<h2 class="section-title">Notes &amp; Journal</h2>
	<NotesCard date={$selectedDate} notes={$currentNotes} journal={$currentJournal} />

	<p class="foot">Synced to Odoo · {$selectedDate}</p>
</div>

<CelebrationToast />

<style>
	header {
		margin-bottom: 14px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.logo {
		width: 44px;
		height: 44px;
		border-radius: 13px;
		display: grid;
		place-items: center;
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--gold));
		box-shadow: var(--shadow);
	}
	.brand-txt {
		display: flex;
		flex-direction: column;
	}
	h1 {
		font-size: 1.35rem;
	}
	.greet {
		font-size: 0.82rem;
		color: var(--text-dim);
	}
	.head-right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.logout {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		color: var(--text-dim);
		background: var(--surface);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	.logout:hover {
		color: var(--red);
		border-color: var(--red);
	}
	.sync {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--text-dim);
		white-space: nowrap;
	}
	.sync.saved {
		color: var(--green);
	}
	.sync.error {
		color: var(--red);
	}
	.hero {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 20px;
		margin-top: 14px;
	}
	.hero-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.msg {
		margin: 0;
		font-size: 1.02rem;
		font-weight: 600;
		line-height: 1.4;
		color: var(--text);
	}
	.stats {
		display: flex;
		gap: 24px;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.big {
		font-size: 1.5rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.big small {
		font-size: 0.9rem;
		color: var(--text-faint);
		font-weight: 700;
	}
	.lbl {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-faint);
	}
	.activities {
		display: grid;
		gap: 10px;
	}
	.foot {
		text-align: center;
		margin-top: 28px;
		font-size: 0.76rem;
		color: var(--text-faint);
	}
	@media (max-width: 520px) {
		.hero {
			flex-direction: column;
			text-align: center;
		}
		.stats {
			justify-content: center;
		}
	}
</style>
