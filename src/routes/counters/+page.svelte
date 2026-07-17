<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import {
		counters,
		loadCounters,
		addCounter,
		increment,
		setValue,
		setGoal,
		reset,
		rename,
		remove
	} from '$lib/counters.js';
	import { settings, saveSettings } from '$lib/settings.js';
	import { THEMES, isDarkTheme, DEFAULT_THEME } from '$lib/themes.js';
	import { ACTIVITIES } from '$lib/config.js';
	import { congratulate } from '$lib/toast.js';
	import CelebrationToast from '$lib/components/CelebrationToast.svelte';

	let active = 0; // index into $counters
	let confirmReset = false;
	let resetTimer = null;
	let pulse = false;

	// Bottom sheet: null | 'create' | 'set' | 'goal' | 'rename' | 'menu' | 'theme'
	let sheet = null;
	let nameInput = '';
	let goalInput = '';
	let numInput = '';

	$: list = $counters;
	// Keep active in range as counters are added/removed.
	$: if (active > list.length - 1) active = Math.max(0, list.length - 1);
	$: counter = list[active] || null;
	$: count = counter?.count ?? 0;
	$: goal = counter?.goal ?? null;
	$: digits = String(count).slice(-5).padStart(5, '0').split('').map(Number);
	$: pct = goal ? Math.min(100, Math.round((count / goal) * 100)) : 0;
	const linkName = (id) => ACTIVITIES.find((a) => a.id === id)?.name || '';
	$: linkLabel = counter?.linkActivity ? linkName(counter.linkActivity) : '';

	onMount(loadCounters);

	function tap() {
		if (!counter) return;
		const next = count + 1;
		increment(counter.id);
		if (goal && next === goal) congratulate();
		pulse = false;
		requestAnimationFrame(() => (pulse = true));
	}

	function dec() {
		if (!counter || count <= 0) return;
		setValue(counter.id, count - 1); // clamps at 0 in localdb
		pulse = false;
		requestAnimationFrame(() => (pulse = true));
	}

	function doReset() {
		if (!counter) return;
		if (!confirmReset) {
			confirmReset = true;
			resetTimer = setTimeout(cancelConfirm, 2500);
			return;
		}
		reset(counter.id);
		cancelConfirm();
	}
	function cancelConfirm() {
		confirmReset = false;
		clearTimeout(resetTimer);
	}

	function openCreate() {
		nameInput = '';
		goalInput = '';
		sheet = 'create';
	}
	function submitCreate() {
		const name = nameInput.trim();
		if (!name) return;
		const id = addCounter({ name, goal: goalInput });
		active = list.findIndex((c) => c.id === id);
		if (active < 0) active = Math.max(0, list.length - 1);
		sheet = null;
	}

	function openSet() {
		if (!counter) return;
		numInput = String(count);
		sheet = 'set';
	}
	function submitSet() {
		setValue(counter.id, Number(numInput));
		sheet = null;
	}

	function openGoal() {
		if (!counter) return;
		numInput = goal ? String(goal) : '';
		sheet = 'goal';
	}
	function submitGoal() {
		setGoal(counter.id, numInput === '' ? 0 : Number(numInput));
		sheet = null;
	}

	function openRename() {
		if (!counter) return;
		nameInput = counter.name;
		sheet = 'rename';
	}
	function submitRename() {
		const name = nameInput.trim();
		if (name) rename(counter.id, name);
		sheet = null;
	}

	function del(id) {
		remove(id);
		sheet = list.length > 1 ? 'menu' : null;
	}

	function pick(i) {
		active = i;
		cancelConfirm();
		sheet = null;
	}
	function go(dir) {
		if (list.length < 2) return;
		active = (active + dir + list.length) % list.length;
		cancelConfirm();
	}

	// --- theme controls ---
	function pickTheme(id) {
		saveSettings({ theme: id });
		sheet = null;
	}
	// Moon: flip to the opposite-mode theme, remembering the last id per mode.
	function toggleDark() {
		const cur = $settings.theme;
		const goingDark = !isDarkTheme(cur);
		try {
			localStorage.setItem(isDarkTheme(cur) ? 'theme:dark' : 'theme:light', cur);
		} catch {
			/* ignore */
		}
		let target;
		try {
			target = localStorage.getItem(goingDark ? 'theme:dark' : 'theme:light');
		} catch {
			target = null;
		}
		if (!target || isDarkTheme(target) !== goingDark) {
			target = THEMES.find((t) => t.dark === goingDark)?.id || DEFAULT_THEME;
		}
		saveSettings({ theme: target });
	}

	// horizontal swipe to switch counters
	let startX = null;
	function touchStart(e) {
		startX = e.changedTouches[0].clientX;
	}
	function touchEnd(e) {
		if (startX == null) return;
		const dx = e.changedTouches[0].clientX - startX;
		if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
		startX = null;
	}

	// ←/→ to switch counters. Skipped while a sheet is open so arrow keys still
	// move the cursor inside its name/goal inputs.
	function onKey(e) {
		if (sheet) return;
		if (e.key === 'ArrowLeft') go(-1);
		else if (e.key === 'ArrowRight') go(1);
	}
</script>

<svelte:window on:keydown={onKey} />

<svelte:head><title>Counters</title></svelte:head>

<div class="screen" role="application" aria-label="Counters" on:touchstart={touchStart} on:touchend={touchEnd}>
	<header class="bar">
		<button class="icon" on:click={() => goto(`${base}/`)} aria-label="back" title="Back">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
		</button>
		<button class="icon" on:click={() => (sheet = 'menu')} aria-label="counters menu" title="Counters" disabled={!list.length}>
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
		</button>
		{#if list.length > 1}
			<button class="nav" on:click={() => go(-1)} aria-label="previous counter" title="Previous">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
			</button>
		{/if}
		<div class="label">
			<p class="name">{counter ? counter.name : 'Counters'}</p>
			{#if goal}<p class="sub">{count} / {goal}</p>{/if}
		</div>
		{#if list.length > 1}
			<button class="nav" on:click={() => go(1)} aria-label="next counter" title="Next">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
			</button>
		{/if}
		<button class="icon" on:click={openCreate} aria-label="new counter" title="New counter">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
		</button>
	</header>

	{#if !list.length}
		<div class="stage empty">
			<p>No counters yet.</p>
			<button class="cta" on:click={openCreate}>Create counter</button>
		</div>
	{:else}
		<div class="controls">
			<button class="ctl" on:click={dec} disabled={count <= 0} aria-label="subtract one" title="−1">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /></svg>
			</button>
			<button class="ctl" class:confirm={confirmReset} on:click={doReset} aria-label="reset" title={confirmReset ? 'Tap again' : 'Reset'}>
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
			</button>
			<button class="ctl" on:click={openSet} aria-label="set number" title="Set number">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
			</button>
			<button class="ctl" on:click={() => (sheet = 'theme')} aria-label="theme" title="Theme">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r="1.3" fill="currentColor" stroke="none"/><path d="M12 2a10 10 0 1 0 0 20 2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 1 2-4h1a5 5 0 0 0 5-5c0-4.4-4.9-7-10-7z"/></svg>
			</button>
			<button class="ctl" on:click={toggleDark} aria-label="toggle dark" title="Light / dark">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" /></svg>
			</button>
		</div>

		<button class="stage tappable" on:click={tap} on:animationend={() => (pulse = false)} aria-label="add one">
			<span class="odometer" class:pulse>
				{#each digits as d}
					<span class="digit">
						<span class="strip" style="transform:translateY(calc(var(--dh) * -{d}))">
							{#each Array(10) as _, n}<span>{n}</span>{/each}
						</span>
					</span>
				{/each}
			</span>
		</button>

		{#if linkLabel}
			<span class="link">↔ {linkLabel}</span>
		{/if}

		{#if goal}
			<div class="goal" on:click={openGoal} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && openGoal()}>
				<div class="track"><div class="fill" style="width:{pct}%"></div></div>
				<span class="gtxt">{count} / {goal} · {pct}%</span>
			</div>
		{:else}
			<button class="setgoal" on:click={openGoal}>Set goal</button>
		{/if}

		{#if list.length > 1}
			<div class="dots" role="tablist" aria-label="switch counter">
				{#each list as c, i}
					<button class="dot" class:on={i === active} role="tab" aria-selected={i === active} aria-label={c.name} on:click={() => pick(i)}></button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- bottom sheets -->
{#if sheet}
	<div class="scrim" on:click={() => (sheet = null)} role="presentation"></div>
	<div class="sheet" role="dialog" aria-modal="true">
		{#if sheet === 'create'}
			<h3>New counter</h3>
			<input class="in" placeholder="Name (e.g. Quran pages)" bind:value={nameInput} maxlength="60" autofocus />
			<input class="in" type="number" inputmode="numeric" placeholder="Goal (optional)" bind:value={goalInput} min="0" />
			<div class="row"><button class="ghost" on:click={() => (sheet = null)}>Cancel</button><button class="primary" on:click={submitCreate}>Create</button></div>
		{:else if sheet === 'set'}
			<h3>Set number</h3>
			<input class="in" type="number" inputmode="numeric" bind:value={numInput} min="0" autofocus />
			<div class="row"><button class="ghost" on:click={() => (sheet = null)}>Cancel</button><button class="primary" on:click={submitSet}>Save</button></div>
		{:else if sheet === 'goal'}
			<h3>Goal</h3>
			<input class="in" type="number" inputmode="numeric" placeholder="Leave empty for none" bind:value={numInput} min="0" autofocus />
			<div class="row"><button class="ghost" on:click={() => (sheet = null)}>Cancel</button><button class="primary" on:click={submitGoal}>Save</button></div>
		{:else if sheet === 'rename'}
			<h3>Rename</h3>
			<input class="in" bind:value={nameInput} maxlength="60" autofocus />
			<div class="row"><button class="ghost" on:click={() => (sheet = null)}>Cancel</button><button class="primary" on:click={submitRename}>Save</button></div>
		{:else if sheet === 'theme'}
			<h3>Theme</h3>
			<div class="themes">
				{#each THEMES as t (t.id)}
					<button class="theme" class:selected={$settings.theme === t.id} on:click={() => pickTheme(t.id)}>
						<span class="swatch">{#each t.swatch as c}<span style="background:{c}"></span>{/each}</span>
						<span class="tname">{t.name}</span>
					</button>
				{/each}
			</div>
		{:else if sheet === 'menu'}
			<h3>Counters</h3>
			<div class="menu">
				{#each list as c, i}
					<div class="mrow" class:on={i === active}>
						<button class="mname" on:click={() => pick(i)}>
							<span>{c.name}</span>
							<span class="mcount">{c.count}{c.goal ? ` / ${c.goal}` : ''}</span>
						</button>
						<button class="mact" aria-label="rename" title="Rename" on:click={() => { active = i; openRename(); }}>✎</button>
						<button class="mact del" aria-label="delete" title="Delete" on:click={() => del(c.id)}>🗑</button>
					</div>
				{/each}
			</div>
			<div class="row"><button class="primary" on:click={openCreate}>New counter</button></div>
		{/if}
	</div>
{/if}

<CelebrationToast />

<style>
	.screen {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--text);
		background: var(--bg);
		overflow: hidden;
		touch-action: pan-y;
		user-select: none;
		-webkit-user-select: none;
	}

	.bar {
		width: 100%;
		max-width: 560px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 0.5rem;
	}
	.icon {
		flex: none;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 50%;
		background: color-mix(in srgb, var(--text) 8%, transparent);
		color: inherit;
		cursor: pointer;
	}
	.icon:disabled { opacity: 0.35; cursor: default; }
	.icon:active { background: color-mix(in srgb, var(--text) 16%, transparent); }
	/* Lighter than .icon — the bar already carries three filled circles. */
	.nav {
		flex: none;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--text-dim, inherit);
		cursor: pointer;
	}
	@media (hover: hover) {
		.nav:hover {
			color: var(--text);
			background: color-mix(in srgb, var(--text) 8%, transparent);
		}
	}
	.nav:active { background: color-mix(in srgb, var(--text) 16%, transparent); }
	.label { flex: 1; text-align: center; min-width: 0; }
	.label .name {
		margin: 0;
		font-family: 'Fraunces Variable', serif;
		font-weight: 600;
		font-size: 1.1rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.label .sub { margin: 0.1rem 0 0; font-size: 0.8rem; color: var(--text-dim); font-variant-numeric: tabular-nums; }

	.controls {
		display: flex;
		gap: 0.9rem;
		padding: 1.25rem 0 0.25rem;
	}
	.ctl {
		width: 52px;
		height: 52px;
		border: none;
		border-radius: 50%;
		background: color-mix(in srgb, var(--text) 8%, transparent);
		color: var(--text-dim);
		cursor: pointer;
		display: grid;
		place-items: center;
		transition: background 0.2s, color 0.2s;
	}
	.ctl:active { background: color-mix(in srgb, var(--text) 16%, transparent); color: var(--text); }
	.ctl:disabled { opacity: 0.3; cursor: default; }
	.ctl.confirm { background: color-mix(in srgb, var(--red) 30%, transparent); color: var(--red); }

	.stage {
		flex: 1;
		width: 100%;
		max-width: 560px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 0 1rem;
	}
	/* whole stage is the tap target — big hit area to increment */
	.stage.tappable {
		border: none;
		background: transparent;
		color: inherit;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.stage.empty { color: var(--text-dim); }
	.cta, .setgoal {
		border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
		background: color-mix(in srgb, var(--text) 6%, transparent);
		color: var(--text);
		padding: 0.7rem 1.4rem;
		border-radius: 999px;
		cursor: pointer;
		font-size: 0.95rem;
	}

	/* ---- odometer ---- */
	.odometer {
		display: flex;
		gap: 0.4rem;
		padding: 1.4rem 1.2rem;
		border: none;
		border-radius: 24px;
		background: #2a2d34;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5), 0 12px 30px rgba(0, 0, 0, 0.35);
		cursor: pointer;
	}
	.odometer.pulse { animation: pop 0.22s ease; }
	@keyframes pop { 0% { transform: scale(1); } 40% { transform: scale(1.04); } 100% { transform: scale(1); } }
	.digit {
		--dh: 1.3em; /* single source of truth: slot height == strip step */
		display: block;
		width: 1.1em;
		height: var(--dh);
		overflow: hidden;
		border-radius: 6px;
		background: linear-gradient(#f6f1e3, #ded7c3);
		box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.35), inset 0 -3px 6px rgba(0, 0, 0, 0.35);
		font-size: 3.2rem;
		font-family: 'Fraunces Variable', serif;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: #16181d;
		text-align: center;
	}
	.strip {
		display: block;
		transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.25, 1);
	}
	.strip span { display: block; height: var(--dh); line-height: var(--dh); }

	.link {
		font-size: 0.78rem;
		color: var(--text-dim);
		background: color-mix(in srgb, var(--text) 8%, transparent);
		padding: 0.2rem 0.7rem;
		border-radius: 999px;
	}

	.goal { width: 100%; max-width: 320px; cursor: pointer; }
	.track {
		height: 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--text) 12%, transparent);
		overflow: hidden;
	}
	.fill { height: 100%; background: var(--teal, #14b8a6); border-radius: 999px; transition: width 0.4s ease; }
	.gtxt { display: block; margin-top: 0.4rem; text-align: center; font-size: 0.8rem; color: var(--text-dim); font-variant-numeric: tabular-nums; }

	.dots { display: flex; gap: 0.55rem; padding: 0.5rem 0 calc(env(safe-area-inset-bottom, 0px) + 1.5rem); }
	.dot {
		width: 9px; height: 9px; padding: 0; border: none; border-radius: 50%;
		background: color-mix(in srgb, var(--text) 25%, transparent); cursor: pointer;
		transition: transform 0.2s, background 0.2s;
	}
	.dot.on { background: var(--teal, #14b8a6); transform: scale(1.3); }

	/* ---- bottom sheet ---- */
	.scrim { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 20; }
	.sheet {
		position: fixed;
		left: 0; right: 0; bottom: 0;
		z-index: 21;
		margin: 0 auto;
		max-width: 480px;
		background: var(--surface);
		color: var(--text);
		border-radius: 20px 20px 0 0;
		padding: 1.2rem 1.2rem calc(env(safe-area-inset-bottom, 0px) + 1.2rem);
		box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.35);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.sheet h3 { margin: 0; font-family: 'Fraunces Variable', serif; font-weight: 600; }
	.in {
		width: 100%;
		padding: 0.7rem 0.9rem;
		border-radius: 12px;
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		background: var(--bg);
		color: var(--text);
		font-size: 1rem;
	}
	.row { display: flex; gap: 0.6rem; justify-content: flex-end; margin-top: 0.25rem; }
	.ghost, .primary {
		padding: 0.6rem 1.2rem; border-radius: 999px; cursor: pointer; font-size: 0.9rem; border: none;
	}
	.ghost { background: transparent; color: var(--text-dim); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }
	.primary { background: var(--teal, #14b8a6); color: #04201c; font-weight: 600; }

	.themes { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
	.theme {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.5rem 0.6rem; border-radius: 12px; cursor: pointer;
		background: var(--bg); color: var(--text);
		border: 1px solid transparent;
	}
	.theme.selected { border-color: var(--teal, #14b8a6); }
	.swatch { display: inline-flex; border-radius: 6px; overflow: hidden; flex: none; }
	.swatch span { width: 12px; height: 20px; }
	.tname { font-size: 0.82rem; }

	.menu { display: flex; flex-direction: column; gap: 0.35rem; max-height: 45vh; overflow-y: auto; }
	.mrow { display: flex; align-items: center; gap: 0.4rem; border-radius: 12px; padding: 0.25rem; }
	.mrow.on { background: color-mix(in srgb, var(--text) 8%, transparent); }
	.mname {
		flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 0.1rem;
		background: transparent; border: none; color: var(--text); cursor: pointer; padding: 0.5rem; text-align: left;
	}
	.mcount { font-size: 0.78rem; color: var(--text-dim); font-variant-numeric: tabular-nums; }
	.mact {
		flex: none; width: 38px; height: 38px; border: none; border-radius: 10px; cursor: pointer;
		background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); font-size: 0.95rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.strip { transition: none; }
		.odometer.pulse { animation: none; }
	}
</style>
