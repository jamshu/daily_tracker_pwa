<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { ACTIVITIES } from '$lib/config.js';
	import { settings, loadSettings, saveSettings, applyTheme } from '$lib/settings.js';
	import { THEMES, DEFAULT_THEME } from '$lib/themes.js';

	// form state: activity id -> target value
	let form = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a.target]));
	let theme = DEFAULT_THEME;
	let shareGlobal = false;
	let sex = 'male';
	let busy = false;
	let status = ''; // '' | 'saved' | 'error'
	let error = '';

	onMount(async () => {
		await loadSettings();
		form = { ...form, ...$settings.activities };
		theme = $settings.theme;
		shareGlobal = $settings.shareGlobal === true;
		sex = $settings.sex === 'female' ? 'female' : 'male';
	});

	function pickTheme(id) {
		theme = id;
		applyTheme(id); // live preview
	}

	async function save() {
		busy = true;
		status = '';
		error = '';
		try {
			await saveSettings({ activities: form, theme, shareGlobal, sex });
			status = 'saved';
			setTimeout(() => (status = ''), 2200);
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
					on:click={() => (sex = 'male')}
				>
					Male
				</button>
				<button
					type="button"
					class="seg-btn"
					class:on={sex === 'female'}
					role="radio"
					aria-checked={sex === 'female'}
					on:click={() => (sex = 'female')}
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
						on:click={() => (form[a.id] = Math.max(1, (Number(form[a.id]) || 0) - a.step))}
						aria-label="decrease">−</button
					>
					<input
						type="number"
						min="1"
						step={a.step}
						bind:value={form[a.id]}
						inputmode="numeric"
					/>
					<button
						type="button"
						on:click={() => (form[a.id] = (Number(form[a.id]) || 0) + a.step)}
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

	<h2 class="section-title">Privacy &amp; sharing</h2>
	<div class="card">
		<button
			type="button"
			class="toggle-row"
			role="switch"
			aria-checked={shareGlobal}
			on:click={() => (shareGlobal = !shareGlobal)}
		>
			<span class="meta">
				<span class="name">Share my score on the global leaderboard</span>
				<span class="unit">Off by default. When on, your name and today's score are visible to everyone.</span>
			</span>
			<span class="switch" class:on={shareGlobal} aria-hidden="true"><span class="knob" /></span>
		</button>
		<p class="disclaimer">
			Share only to encourage one another toward good. Keep your intention sincere — seek
			acceptance from Allah, not the praise of people. “Actions are but by intentions.”
		</p>
	</div>

	<div class="actions">
		<button class="ghost" type="button" on:click={resetDefaults} disabled={busy}>Reset to defaults</button>
		<button class="primary" type="button" on:click={save} disabled={busy}>
			{#if busy}<span class="spinner" />{:else}Save{/if}
		</button>
	</div>

	{#if status === 'saved'}<p class="ok">Saved — your goals are updated.</p>{/if}
	{#if status === 'error'}<p class="err">{error}</p>{/if}

	<p class="note">Goals are saved to your account and apply across your devices.</p>
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
	.back:hover {
		background: var(--surface-2);
	}
	h1 {
		font-size: 1.35rem;
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
		color: #042f2a;
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
	.stepper button:hover {
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
	.theme:hover {
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
	.actions {
		display: flex;
		gap: 10px;
		margin-top: 18px;
	}
	.primary,
	.ghost {
		flex: 1;
		height: 46px;
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 0.96rem;
		display: grid;
		place-items: center;
	}
	.primary {
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--green));
	}
	.primary:disabled {
		opacity: 0.7;
	}
	.ghost {
		color: var(--text-dim);
		background: var(--surface);
		border: 1px solid var(--border);
		flex: 0 0 auto;
		padding: 0 16px;
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
		border: 2px solid rgba(4, 47, 42, 0.35);
		border-top-color: #042f2a;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
