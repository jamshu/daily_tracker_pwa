<script>
	import { base } from '$app/paths';

	let reminders = [];
	let loading = true;
	let adding = false;
	let newTitle = '';
	let newDatetime = '';
	let busy = false;
	let error = '';

	async function load() {
		try {
			const res = await fetch(`${base}/api/push/reminders`);
			if (!res.ok) return;
			const d = await res.json();
			reminders = d.reminders ?? [];
		} catch { /* ignore */ } finally {
			loading = false;
		}
	}

	async function addReminder() {
		const title = newTitle.trim();
		if (!title || !newDatetime) { adding = false; return; }
		busy = true;
		error = '';
		try {
			const res = await fetch(`${base}/api/push/reminders`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'add', title, datetime: newDatetime })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || !d.ok) throw new Error(d.error || 'Failed');
			adding = false;
			newTitle = '';
			newDatetime = '';
			await load();
		} catch (e) {
			error = e.message;
		} finally {
			busy = false;
		}
	}

	async function deleteReminder(id) {
		try {
			await fetch(`${base}/api/push/reminders`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'delete', id })
			});
			reminders = reminders.filter((r) => r.id !== id);
		} catch { /* ignore */ }
	}

	function formatDatetime(odooDatetime) {
		if (!odooDatetime) return '';
		// Odoo returns "YYYY-MM-DD HH:MM:SS" — treat as local time
		const iso = odooDatetime.replace(' ', 'T');
		return new Date(iso).toLocaleString(undefined, {
			month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
		});
	}

	load();
</script>

<div class="reminder-widget">
	<div class="widget-header">
		<span class="widget-title">Reminders</span>
	</div>

	{#if loading}
		<p class="rw-empty">Loading…</p>
	{:else}
		{#each reminders as r (r.id)}
			<div class="reminder-row">
				<div class="meta">
					<span class="rname">{r.x_name}</span>
					<span class="rtime">{formatDatetime(r.x_studio_datetime)}</span>
				</div>
				<button
					class="del-reminder"
					type="button"
					on:click={() => deleteReminder(r.id)}
					aria-label="delete reminder"
				>
					<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}

		{#if reminders.length === 0 && !adding}
			<p class="rw-empty">No reminders yet.</p>
		{/if}

		{#if adding}
			<div class="rw-form">
				<input
					class="rinput"
					type="text"
					placeholder="Reminder title"
					bind:value={newTitle}
					maxlength="60"
					autofocus
					on:keydown={(e) => e.key === 'Enter' && addReminder()}
				/>
				<input
					class="rinput"
					type="datetime-local"
					bind:value={newDatetime}
				/>
				{#if error}<p class="rw-err">{error}</p>{/if}
				<div class="rw-actions">
					<button class="rw-add-btn" type="button" disabled={busy || !newTitle.trim() || !newDatetime} on:click={addReminder}>
						{busy ? 'Adding…' : 'Add'}
					</button>
					<button class="rw-cancel-btn" type="button" on:click={() => { adding = false; error = ''; }}>Cancel</button>
				</div>
			</div>
		{:else}
			<button class="rw-new" type="button" on:click={() => (adding = true)}>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 5v14M5 12h14" />
				</svg>
				Add reminder
			</button>
		{/if}
	{/if}
</div>

<style>
	.reminder-widget {
		display: flex;
		flex-direction: column;
	}
	.widget-header {
		padding: 14px 14px 6px;
	}
	.widget-title {
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.reminder-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 14px;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
	}
	.reminder-row:last-of-type {
		border-bottom: none;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.rname {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.rtime {
		font-size: 0.76rem;
		color: var(--text-faint);
	}
	.del-reminder {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		color: var(--text-faint);
		flex: 0 0 auto;
		transition: all 0.15s ease;
	}
	.del-reminder:hover {
		color: var(--red);
		background: color-mix(in srgb, var(--red) 12%, transparent);
	}
	.rw-empty {
		padding: 10px 14px;
		font-size: 0.84rem;
		color: var(--text-faint);
		margin: 0;
	}
	.rw-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 14px;
		border-top: 1px solid var(--border);
	}
	.rinput {
		width: 100%;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--teal);
		background: var(--bg-soft);
		color: var(--text);
		font-family: inherit;
		font-size: 0.88rem;
	}
	.rinput:focus {
		outline: none;
	}
	.rw-err {
		font-size: 0.82rem;
		color: var(--red);
		margin: 0;
	}
	.rw-actions {
		display: flex;
		gap: 8px;
	}
	.rw-add-btn {
		padding: 7px 16px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.84rem;
		color: #042f2a;
		background: var(--teal);
		flex: 0 0 auto;
	}
	.rw-add-btn:disabled {
		opacity: 0.5;
	}
	.rw-cancel-btn {
		padding: 7px 12px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.84rem;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
	}
	.rw-new {
		display: flex;
		align-items: center;
		gap: 7px;
		width: 100%;
		padding: 12px 14px;
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-faint);
		border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
		transition: color 0.15s ease;
	}
	.rw-new:hover {
		color: var(--teal);
	}
</style>
