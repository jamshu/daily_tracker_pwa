<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { ACTIVITIES } from '$lib/config.js';
	import { settings, loadSettings, saveSettings, applyTheme } from '$lib/settings.js';
	import { THEMES, DEFAULT_THEME } from '$lib/themes.js';
	import { syncReminder } from '$lib/notify.js';
	import * as localdb from '$lib/localdb.js';

	// form state: activity id -> target value
	let form = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a.target]));
	let theme = DEFAULT_THEME;
	let sex = 'male';
	let showNotes = false;
	let reminderOn = true;
	let reminderTime = '21:00';
	let busy = false;
	let status = ''; // '' | 'saving' | 'saved' | 'error'
	let error = '';
	let mounted = false;
	let saveTimer = null;
	let notifDenied = false; // web: browser notifications blocked

	function refreshNotifState() {
		notifDenied =
			typeof window !== 'undefined' &&
			'Notification' in window &&
			Notification.permission === 'denied';
	}

	// backup state
	let exportBusy = false;
	let importError = '';

	onMount(async () => {
		await loadSettings();
		form = { ...form, ...$settings.activities };
		theme = $settings.theme;
		sex = $settings.sex === 'female' ? 'female' : 'male';
		showNotes = $settings.showNotes === true;
		reminderOn = $settings.reminderTime != null;
		if ($settings.reminderTime) reminderTime = $settings.reminderTime;
		refreshNotifState();
		mounted = true;
	});

	function scheduleAutoSave() {
		if (!mounted) return;
		clearTimeout(saveTimer);
		status = 'saving';
		saveTimer = setTimeout(save, 800);
	}

	function pickTheme(id) {
		theme = id;
		applyTheme(id);
		scheduleAutoSave();
	}

	async function save() {
		busy = true;
		status = 'saving';
		error = '';
		try {
			const rt = reminderOn ? reminderTime : null;
			await saveSettings({ activities: form, theme, sex, showNotes, reminderTime: rt });
			await syncReminder(rt);
			refreshNotifState();
			status = 'saved';
			setTimeout(() => { if (status === 'saved') status = ''; }, 2200);
		} catch (e) {
			status = 'error';
			error = e?.message || 'Could not save';
		} finally {
			busy = false;
		}
	}

	function resetDefaults() {
		form = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a.target]));
		theme = DEFAULT_THEME;
		applyTheme(DEFAULT_THEME);
		scheduleAutoSave();
	}

	async function exportBackup() {
		exportBusy = true;
		try {
			const json = await localdb.exportJSON();
			const filename = `daily-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
			const { Capacitor } = await import('@capacitor/core');
			if (Capacitor.isNativePlatform()) {
				// <a download> is unreliable in WKWebView — write to cache + share sheet.
				const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
				const res = await Filesystem.writeFile({
					path: filename,
					directory: Directory.Cache,
					data: json,
					encoding: Encoding.UTF8
				});
				const { Share } = await import('@capacitor/share');
				await Share.share({ title: 'Daily Tracker backup', url: res.uri });
			} else {
				const a = document.createElement('a');
				a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
				a.download = filename;
				a.click();
				URL.revokeObjectURL(a.href);
			}
		} catch (e) {
			importError = e?.message || 'Export failed';
		} finally {
			exportBusy = false;
		}
	}

	async function importBackup(e) {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		importError = '';
		try {
			const obj = JSON.parse(await file.text());
			await localdb.importJSON(obj);
			location.reload();
		} catch (err) {
			importError = err?.message || 'Import failed — not a valid backup file';
		}
	}
</script>

<svelte:head><title>Settings · Daily Tracker</title></svelte:head>

<div class="app">
	<header>
		<button class="back" on:click={() => goto(`${base}/`)} aria-label="back">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1>Settings</h1>
	</header>

	<h2 class="section-title">Profile</h2>
	<div class="card">
		<div class="sex-row">
			<span class="meta">
				<span class="name">Sex</span>
				<span class="unit">Affects prayer scoring — a woman praying at home scores the same as in Jamāʻah.</span>
			</span>
			<div class="seg" role="radiogroup" aria-label="Sex">
				<button
					type="button"
					class="seg-btn"
					class:on={sex === 'male'}
					role="radio"
					aria-checked={sex === 'male'}
					on:click={() => { sex = 'male'; scheduleAutoSave(); }}
				>
					Male
				</button>
				<button
					type="button"
					class="seg-btn"
					class:on={sex === 'female'}
					role="radio"
					aria-checked={sex === 'female'}
					on:click={() => { sex = 'female'; scheduleAutoSave(); }}
				>
					Female
				</button>
			</div>
		</div>
	</div>

	<h2 class="section-title">Daily goals</h2>
	<div class="card goals">
		{#each ACTIVITIES as a (a.id)}
			<div class="goal">
				<div class="meta">
					<span class="name">{a.name}</span>
					<span class="unit">Target in {a.unit}</span>
				</div>
				<div class="stepper">
					<button
						type="button"
						on:click={() => { form[a.id] = Math.max(1, (Number(form[a.id]) || 0) - a.step); scheduleAutoSave(); }}
						aria-label="decrease">−</button
					>
					<input
						type="number"
						min="1"
						step={a.step}
						bind:value={form[a.id]}
						inputmode="numeric"
						on:input={scheduleAutoSave}
					/>
					<button
						type="button"
						on:click={() => { form[a.id] = (Number(form[a.id]) || 0) + a.step; scheduleAutoSave(); }}
						aria-label="increase">+</button
					>
				</div>
			</div>
		{/each}
	</div>

	<h2 class="section-title">Theme</h2>
	<div class="card themes">
		{#each THEMES as t (t.id)}
			<button
				type="button"
				class="theme"
				class:selected={theme === t.id}
				aria-pressed={theme === t.id}
				on:click={() => pickTheme(t.id)}
			>
				<span class="swatch" aria-hidden="true">
					{#each t.swatch as c}
						<span style="background:{c}"></span>
					{/each}
				</span>
				<span class="tname">{t.name}</span>
				{#if theme === t.id}
					<svg class="check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
				{/if}
			</button>
		{/each}
	</div>

	<h2 class="section-title">Widgets</h2>
	<div class="card">
		<button
			type="button"
			class="toggle-row"
			role="switch"
			aria-checked={showNotes}
			on:click={() => { showNotes = !showNotes; scheduleAutoSave(); }}
		>
			<span class="meta">
				<span class="name">Notes</span>
				<span class="unit">Show the daily notes field on the home screen.</span>
			</span>
			<span class="switch" class:on={showNotes} aria-hidden="true"><span class="knob" /></span>
		</button>
	</div>

	<h2 class="section-title">Daily reminder</h2>
	<div class="card">
		<button
			type="button"
			class="toggle-row"
			role="switch"
			aria-checked={reminderOn}
			on:click={() => { reminderOn = !reminderOn; scheduleAutoSave(); }}
		>
			<span class="meta">
				<span class="name">Remind me to log my day</span>
				<span class="unit">A daily notification on this device. Works in the installed app.</span>
			</span>
			<span class="switch" class:on={reminderOn} aria-hidden="true"><span class="knob" /></span>
		</button>
		{#if reminderOn}
			<div class="time-row">
				<span class="meta"><span class="name">Time</span></span>
				<input
					class="time-input"
					type="time"
					bind:value={reminderTime}
					on:change={scheduleAutoSave}
				/>
			</div>
			{#if notifDenied}
				<p class="notif-hint">Notifications are blocked in your browser — enable them in site settings to receive reminders.</p>
			{/if}
		{/if}
	</div>

	<h2 class="section-title">Backup</h2>
	<div class="card">
		<div class="backup-row">
			<span class="meta">
				<span class="name">Export data</span>
				<span class="unit">All your data stays on this phone. Save a backup file so it survives losing or replacing the device.</span>
			</span>
			<button class="backup-btn" type="button" disabled={exportBusy} on:click={exportBackup}>
				{exportBusy ? 'Exporting…' : 'Export'}
			</button>
		</div>
		<div class="backup-row">
			<span class="meta">
				<span class="name">Import backup</span>
				<span class="unit">Restores from a backup file. Replaces everything currently in the app.</span>
			</span>
			<label class="backup-btn">
				Import
				<input type="file" accept=".json,application/json" on:change={importBackup} hidden />
			</label>
		</div>
		{#if importError}<p class="err" style="margin:0 14px 12px">{importError}</p>{/if}
	</div>

	<div class="reset-row">
		<button class="ghost" type="button" on:click={resetDefaults} disabled={busy}>Reset to defaults</button>
	</div>

	<div class="autosave-status">
		{#if status === 'saving'}<span class="saving"><span class="spinner-sm" />Saving…</span>
		{:else if status === 'saved'}<span class="ok">Saved</span>
		{:else if status === 'error'}<span class="err">{error}</span>{/if}
	</div>

	<p class="note">Changes save automatically on this device.</p>
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
		margin-bottom: 8px;
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
		font-size: 1.6rem;
		font-variation-settings: 'SOFT' 50;
		letter-spacing: -0.02em;
	}
	.sex-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 14px;
	}
	.sex-row .meta {
		flex: 1;
	}
	.seg {
		flex: 0 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 4px;
	}
	.seg-btn {
		padding: 7px 16px;
		border-radius: 999px;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--text-dim);
		background: transparent;
	}
	.seg-btn.on {
		color: var(--on-accent);
		background: var(--teal);
	}
	.goals {
		display: flex;
		flex-direction: column;
	}
	.goal {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px;
		border-bottom: 1px solid var(--border);
	}
	.goal:last-child {
		border-bottom: none;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.name {
		font-weight: 700;
		font-size: 1.02rem;
	}
	.unit {
		font-size: 0.76rem;
		color: var(--text-faint);
	}
	.stepper {
		display: flex;
		align-items: center;
		gap: 4px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 4px;
	}
	.stepper button {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--text);
		background: var(--surface-2);
		display: grid;
		place-items: center;
		line-height: 1;
	}
	@media (hover: hover) {
		.stepper button:hover {
			background: var(--teal-deep);
		}
	}
	.stepper button:active {
		background: var(--teal-deep);
	}
	.stepper input {
		width: 56px;
		text-align: center;
		font-weight: 700;
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		color: var(--text);
		background: transparent;
		border: none;
		-moz-appearance: textfield;
	}
	.stepper input::-webkit-outer-spin-button,
	.stepper input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.stepper input:focus {
		outline: none;
	}
	.themes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		padding: 10px;
	}
	.theme {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		color: var(--text);
		text-align: left;
	}
	@media (hover: hover) {
		.theme:hover {
			background: var(--surface-2);
		}
	}
	.theme:active {
		background: var(--surface-2);
	}
	.theme.selected {
		border-color: var(--teal);
		box-shadow: 0 0 0 1px var(--teal);
	}
	.swatch {
		display: inline-flex;
		flex: 0 0 auto;
		border-radius: 999px;
		overflow: hidden;
		border: 1px solid var(--border);
	}
	.swatch span {
		width: 14px;
		height: 24px;
	}
	.tname {
		font-weight: 600;
		font-size: 0.9rem;
		flex: 1;
	}
	.check {
		flex: 0 0 auto;
		color: var(--teal);
	}
	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		width: 100%;
		padding: 14px;
		text-align: left;
		color: var(--text);
		background: transparent;
	}
	.toggle-row .meta {
		flex: 1;
	}
	.disclaimer {
		margin: 0;
		padding: 0 14px 14px;
		font-size: 0.78rem;
		line-height: 1.5;
		color: var(--text-faint);
		font-style: italic;
	}
	.switch {
		flex: 0 0 auto;
		width: 46px;
		height: 28px;
		border-radius: 999px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		position: relative;
		transition: background 0.18s ease;
	}
	.switch.on {
		background: var(--teal);
		border-color: var(--teal);
	}
	.switch .knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		transition: transform 0.18s ease;
	}
	.switch.on .knob {
		transform: translateX(18px);
	}
	.reset-row {
		margin-top: 18px;
		display: flex;
		justify-content: center;
	}
	.ghost {
		height: 40px;
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: 0.88rem;
		display: grid;
		place-items: center;
		color: var(--text-dim);
		background: var(--surface);
		border: 1px solid var(--border);
		padding: 0 16px;
	}
	@media (hover: hover) {
		.ghost:hover:not(:disabled) { border-color: var(--teal); color: var(--teal); }
	}
	.ghost:active:not(:disabled) { border-color: var(--teal); color: var(--teal); }
	.autosave-status {
		min-height: 28px;
		margin-top: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.84rem;
	}
	.saving {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-faint);
	}
	.spinner-sm {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		border: 2px solid color-mix(in srgb, var(--teal) 30%, transparent);
		border-top-color: var(--teal);
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}
	.ok {
		margin: 12px 0 0;
		color: var(--green);
		font-size: 0.9rem;
		font-weight: 600;
	}
	.err {
		margin: 12px 0 0;
		color: var(--red);
		font-size: 0.9rem;
	}
	.note {
		margin-top: 18px;
		font-size: 0.78rem;
		color: var(--text-faint);
		text-align: center;
	}
	.spinner {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid color-mix(in srgb, var(--on-accent) 35%, transparent);
		border-top-color: var(--on-accent);
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* daily reminder */
	.time-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 0 14px 14px;
	}
	.notif-hint {
		margin: 0;
		padding: 0 14px 14px;
		font-size: 0.8rem;
		line-height: 1.4;
		color: var(--red, #f87171);
	}
	.time-input {
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-soft);
		color: var(--text);
		font-family: inherit;
		/* 16px min — smaller makes iOS Safari auto-zoom on focus and stay zoomed. */
		font-size: 16px;
	}
	.time-input:focus {
		outline: none;
		border-color: var(--teal);
	}

	/* backup */
	.backup-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 14px;
		border-bottom: 1px solid var(--border);
	}
	.backup-row:last-of-type {
		border-bottom: none;
	}
	.backup-row .meta {
		flex: 1;
	}
	.backup-btn {
		flex: 0 0 auto;
		padding: 9px 16px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.84rem;
		color: var(--on-accent);
		background: var(--teal);
		cursor: pointer;
	}
	.backup-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
