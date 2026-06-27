<script>
	import { onMount } from 'svelte';
	import { PRAYERS, ACTIVITIES, DEEDS, NAWAFIL, PRAYER_MARKS } from '$lib/config.js';
	import {
		currentDay,
		currentProgress,
		currentNotes,
		selectedDate,
		syncState,
		dateKey,
		shiftKey,
		togglePrayer,
		setActivity,
		setCustomActivity,
		toggleDeed,
		toggleNafl,
		load
	} from '$lib/store.js';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import PrayerCard from '$lib/components/PrayerCard.svelte';
	import ActivityCard from '$lib/components/ActivityCard.svelte';
	import CustomActivityCard from '$lib/components/CustomActivityCard.svelte';
	import DeedToggle from '$lib/components/DeedToggle.svelte';
	import QuoteCard from '$lib/components/QuoteCard.svelte';
	import NotesCard from '$lib/components/NotesCard.svelte';
	import DateNav from '$lib/components/DateNav.svelte';
	import WeekStrip from '$lib/components/WeekStrip.svelte';
	import CelebrationToast from '$lib/components/CelebrationToast.svelte';
	import AdhkarModal from '$lib/components/AdhkarModal.svelte';
	import { celebrate } from '$lib/toast.js';
	import { openAdhkar } from '$lib/adhkar.js';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { user, logout } from '$lib/auth.js';
	import { settings, loadSettings } from '$lib/settings.js';
	import { pendingInviteCount, loadGroups } from '$lib/groups.js';
	import FifaCard from '$lib/components/FifaCard.svelte';
	import { loadFifa } from '$lib/fifa.js';
	import NewsCard from '$lib/components/NewsCard.svelte';
	import { loadNews } from '$lib/news.js';
	import TodoWidget from '$lib/components/TodoWidget.svelte';

	const todayK = dateKey();

	onMount(() => {
		load();
		loadSettings();
		loadGroups(); // for the leaderboard invite badge
		loadFifa();
		loadNews();
	});

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
		return n + (r.jamath || r.home ? 1 : 0) + (p.hasSunnah && r.sunnah ? 1 : 0) + (r.dhikr ? 1 : 0);
	}, 0);
	$: activitiesMet = ACTIVITIES.filter(
		(a) => ($currentDay.activities[a.id] || 0) >= ($settings.activities[a.id] ?? a.target)
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

	// Toggle a voluntary prayer (Tahajjud / Duha); celebrate when marked done.
	function onNaflToggle(nafl) {
		const wasOn = $currentDay.nawafil?.[nafl.id];
		toggleNafl($selectedDate, nafl.id);
		if (!wasOn) celebrate(nafl.id);
	}

	// Set an activity value; celebrate the moment it reaches its target.
	function onActivitySet(activity, value) {
		const target = $settings.activities[activity.id] ?? activity.target;
		const prev = $currentDay.activities[activity.id] || 0;
		setActivity($selectedDate, activity.id, value);
		if (prev < target && value >= target) celebrate(activity.id);
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
				<button class="gear trophy" on:click={() => goto(`${base}/leaderboard`)} title="Leaderboard" aria-label="leaderboard">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
						<path d="M5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3" />
					</svg>
					{#if $pendingInviteCount}<span class="badge">{$pendingInviteCount}</span>{/if}
				</button>
				<button class="gear" on:click={() => goto(`${base}/budget`)} title="Budget" aria-label="budget">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="5" width="20" height="14" rx="3" />
						<path d="M16 10a2 2 0 0 1 0 4" />
						<circle cx="16" cy="12" r="2" />
					</svg>
				</button>
				<button class="gear" on:click={() => goto(`${base}/settings`)} title="Settings" aria-label="settings">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="3" />
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
					</svg>
				</button>
				<button class="logout" on:click={doLogout} title="Sign out" aria-label="sign out">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

	<section class="hero card fade-in" style="--fade-delay:0.05s">
		<svg class="hero-motif" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
			<g fill="none" stroke="currentColor" stroke-width="1">
				<rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
				<rect x="22" y="22" width="56" height="56" />
				<circle cx="50" cy="50" r="39" />
			</g>
		</svg>
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

	<h2 class="section-title fade-in" style="--fade-delay:0.10s">FIFA World Cup 2026</h2>
	<div class="fade-in" style="--fade-delay:0.12s">
		<FifaCard />
	</div>

	<h2 class="section-title fade-in" style="--fade-delay:0.16s">World News</h2>
	<div class="fade-in" style="--fade-delay:0.18s">
		<NewsCard />
	</div>

	<div class="fade-in" style="--fade-delay:0.22s"><QuoteCard /></div>

	<button class="dhikr-link fade-in" style="--fade-delay:0.22s" on:click={() => openAdhkar('afterSalah')}>
		<span class="dl-icon">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
			</svg>
		</span>
		<span class="dl-text">
			<strong>Dhikr after Salah</strong>
			<small>The remembrance to recite after every fard prayer</small>
		</span>
		<svg class="dl-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M9 18l6-6-6-6" />
		</svg>
	</button>

	<button class="dhikr-link fade-in" style="--fade-delay:0.23s" on:click={() => openAdhkar('janaza')}>
		<span class="dl-icon">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 2L8 7H4l2 5-4 5h5l5 5 5-5h5l-4-5 2-5h-4L12 2z" />
			</svg>
		</span>
		<span class="dl-text">
			<strong>Janaza Prayer</strong>
			<small>4 Takbeers — duas for the funeral prayer</small>
		</span>
		<svg class="dl-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M9 18l6-6-6-6" />
		</svg>
	</button>

	<h2 class="section-title fade-in" style="--fade-delay:0.24s">Prayers · Jamāʻah, Sunnah &amp; Dhikr</h2>
	<div class="card fade-in" style="--fade-delay:0.28s">
		{#each PRAYERS as p (p.id)}
			<PrayerCard
				prayer={p}
				record={$currentDay.prayers[p.id]}
				on:toggle={(e) => onPrayerToggle(p, e.detail.field)}
			/>
		{/each}
	</div>

	<h2 class="section-title fade-in" style="--fade-delay:0.32s">Voluntary Prayers</h2>
	<div class="card fade-in" style="--fade-delay:0.34s">
		{#each NAWAFIL as n (n.id)}
			<DeedToggle
				deed={n}
				done={$currentDay.nawafil?.[n.id] || false}
				on:toggle={() => onNaflToggle(n)}
			/>
		{/each}
	</div>

	<h2 class="section-title fade-in" style="--fade-delay:0.38s">Daily Deeds</h2>
	<div class="card fade-in" style="--fade-delay:0.40s">
		{#each DEEDS as d (d.id)}
			<DeedToggle
				deed={d}
				done={$currentDay.deeds?.[d.id] || false}
				on:toggle={() => onDeedToggle(d)}
				on:info={() => openAdhkar(d.guide)}
			/>
		{/each}
	</div>

	<h2 class="section-title fade-in" style="--fade-delay:0.44s">Activities</h2>
	<div class="activities fade-in" style="--fade-delay:0.46s">
		{#each ACTIVITIES as a (a.id)}
			<ActivityCard
				activity={a}
				value={$currentDay.activities[a.id] || 0}
				target={$settings.activities[a.id]}
				on:set={(e) => onActivitySet(a, e.detail.value)}
			/>
		{/each}
	</div>

	{#if $settings.customActivities?.length}
		<h2 class="section-title fade-in" style="--fade-delay:0.48s">Additional Activities</h2>
		<div class="activities fade-in" style="--fade-delay:0.50s">
			{#each $settings.customActivities as a (a.id)}
				<CustomActivityCard
					activity={a}
					value={$currentDay.customActivities?.[a.id] ?? 0}
					on:set={(e) => setCustomActivity($selectedDate, a.id, e.detail.value)}
				/>
			{/each}
		</div>
	{/if}

	<h2 class="section-title fade-in" style="--fade-delay:0.52s">Notes</h2>
	<div class="fade-in" style="--fade-delay:0.54s">
		<NotesCard date={$selectedDate} notes={$currentNotes} />
	</div>

	<h2 class="section-title fade-in" style="--fade-delay:0.56s">Todo</h2>
	<div class="card fade-in" style="--fade-delay:0.58s">
		<TodoWidget />
	</div>

	<p class="foot">Synced to Backend · {$selectedDate}</p>
</div>

<CelebrationToast />
<AdhkarModal />

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
		font-size: 1.5rem;
		font-variation-settings: 'SOFT' 50, 'WONK' 0;
		letter-spacing: -0.02em;
	}
	.greet {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 0.92rem;
		color: var(--text-dim);
	}
	.head-right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.logout {
		width: 40px;
		height: 40px;
		border-radius: 11px;
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
	.gear {
		width: 40px;
		height: 40px;
		border-radius: 11px;
		display: grid;
		place-items: center;
		color: var(--text-dim);
		background: var(--surface);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	.gear:hover {
		color: var(--text);
		border-color: var(--teal);
	}
	.trophy {
		position: relative;
	}
	.trophy .badge {
		position: absolute;
		top: -6px;
		right: -6px;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		border-radius: 999px;
		background: var(--red);
		color: #fff;
		font-size: 0.66rem;
		font-weight: 700;
		display: grid;
		place-items: center;
		line-height: 1;
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
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		gap: 22px;
		padding: 26px 24px;
		margin-top: 14px;
		border-radius: var(--radius-lg);
	}
	/* faint geometric watermark behind the ring — theme-safe via currentColor */
	.hero-motif {
		position: absolute;
		left: -28px;
		top: 50%;
		transform: translateY(-50%);
		width: 200px;
		height: 200px;
		color: var(--teal);
		opacity: 0.06;
		pointer-events: none;
		z-index: 0;
	}
	.hero :global(.ring),
	.hero-info {
		position: relative;
		z-index: 1;
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
		font-family: var(--font-display);
		font-size: 1.7rem;
		font-weight: 600;
		font-optical-sizing: auto;
		font-variation-settings: 'SOFT' 40;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	.big small {
		font-family: var(--font-body);
		font-size: 0.86rem;
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
	.dhikr-link {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 26px;
		padding: 13px 14px;
		border-radius: var(--radius);
		text-align: left;
		color: var(--text);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--teal) 16%, transparent),
			color-mix(in srgb, var(--gold) 12%, transparent)
		);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
		transition: all 0.15s ease;
	}
	.dhikr-link:hover {
		border-color: var(--teal);
		transform: translateY(-1px);
	}
	.dhikr-link:active {
		transform: scale(0.99);
	}
	.dl-icon {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		border-radius: 11px;
		display: grid;
		place-items: center;
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--gold));
	}
	.dl-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.dl-text strong {
		font-size: 0.98rem;
		font-weight: 700;
	}
	.dl-text small {
		font-size: 0.76rem;
		color: var(--text-dim);
	}
	.dl-chev {
		flex-shrink: 0;
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
