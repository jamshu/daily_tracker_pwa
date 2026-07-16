<script>
	import { welcomeOpen, closeWelcome } from '$lib/welcome.js';
	import { saveSettings } from '$lib/settings.js';

	let name = '';
	let saving = false;

	// Live initial for the avatar; a wave when nothing typed yet.
	$: initial = name.trim() ? name.trim()[0].toUpperCase() : '';

	async function submit() {
		const n = name.trim();
		if (!n || saving) return;
		saving = true;
		try {
			await saveSettings({ name: n });
			closeWelcome();
		} finally {
			saving = false;
		}
	}

	function onKey(e) {
		if (e.key === 'Enter') submit();
	}
</script>

{#if $welcomeOpen}
	<div class="backdrop" role="presentation">
		<div class="card" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
			<div class="avatar" aria-hidden="true">
				{#if initial}
					<span class="initial">{initial}</span>
				{:else}
					<span class="wave">👋</span>
				{/if}
			</div>
			<h2 id="welcome-title">Assalāmu ʻalaykum</h2>
			<p class="sub">What should we call you?</p>
			<input
				class="field"
				type="text"
				placeholder="Your name"
				bind:value={name}
				on:keydown={onKey}
				maxlength="40"
				autocomplete="off"
				autocapitalize="words"
				enterkeyhint="done"
				aria-label="Your name"
				autofocus
			/>
			<button class="primary" disabled={!name.trim() || saving} on:click={submit}>
				{saving ? 'Saving…' : 'Continue'}
			</button>
			<p class="hint">Stays on this device. You can change it later in Settings.</p>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 90;
		background: rgba(2, 6, 16, 0.62);
		backdrop-filter: blur(3px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		animation: fade 0.2s ease;
	}
	.card {
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 12px;
		padding: 28px 22px calc(24px + env(safe-area-inset-bottom, 0px));
		background: linear-gradient(180deg, var(--surface-2), var(--surface));
		border: 1px solid var(--border);
		border-radius: var(--radius-lg, 24px);
		box-shadow: var(--shadow-lg, 0 20px 60px rgba(0, 0, 0, 0.5));
		animation: pop 0.34s cubic-bezier(0.18, 1, 0.4, 1);
	}
	.avatar {
		width: 76px;
		height: 76px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: linear-gradient(135deg, var(--teal), var(--gold));
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
		margin-bottom: 2px;
	}
	.initial {
		font-family: var(--font-display);
		font-size: 2.1rem;
		font-weight: 800;
		line-height: 1;
		color: var(--on-accent);
	}
	.wave {
		font-size: 2rem;
		line-height: 1;
	}
	h2 {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 800;
		margin: 0;
	}
	.sub {
		margin: 0;
		font-size: 0.95rem;
		color: var(--text-dim);
	}
	.field {
		width: 100%;
		margin-top: 4px;
		padding: 13px 14px;
		text-align: center;
		font-size: 16px; /* ≥16px so iOS Safari doesn't auto-zoom on focus */
		color: var(--text);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: 12px;
	}
	.field:focus {
		outline: none;
		border-color: var(--teal);
	}
	.primary {
		width: 100%;
		padding: 14px;
		border-radius: 12px;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--on-accent);
		background: var(--teal);
		border: 1px solid var(--teal);
	}
	.primary:disabled {
		opacity: 0.45;
	}
	.hint {
		margin: 2px 0 0;
		font-size: 0.78rem;
		color: var(--text-faint);
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
