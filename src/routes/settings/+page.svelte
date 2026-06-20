<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { ACTIVITIES } from '$lib/config.js';
	import { settings, loadSettings, saveSettings } from '$lib/settings.js';

	// form state: activity id -> target value
	let form = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a.target]));
	let busy = false;
	let status = ''; // '' | 'saved' | 'error'
	let error = '';

	onMount(async () => {
		await loadSettings();
		form = { ...form, ...$settings.activities };
	});

	async function save() {
		busy = true;
		status = '';
		error = '';
		try {
			await saveSettings(form);
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
