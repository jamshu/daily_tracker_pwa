<script>
	import { base } from '$app/paths';

	let reminders = [];
	let loading = true;
	let adding = false;
	let newTitle = '';
	let pickDate = '';
	let pickTime = '';
	let busy = false;
	let error = '';

	const pad = (n) => String(n).padStart(2, '0');

	// Format a local Date as an Odoo UTC datetime string "YYYY-MM-DD HH:MM:SS".
	function toOdooUtc(d) {
		return (
			`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
			`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`
		);
	}

	// Fill the date/time fields (local) from a Date — used by the quick presets.
	function setLocal(d) {
		pickDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
		pickTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function presetIn(hours) {
		const d = new Date(Date.now() + hours * 3600_000);
		setLocal(d);
	}
	function presetToday(hour) {
		const d = new Date();
		d.setHours(hour, 0, 0, 0);
		if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1); // already past → tomorrow
		setLocal(d);
	}
	function presetTomorrow(hour) {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		d.setHours(hour, 0, 0, 0);
		setLocal(d);
	}

	// Build the UTC datetime to send from the local date+time fields.
	$: newDatetime =
		pickDate && pickTime ? toOdooUtc(new Date(`${pickDate}T${pickTime}`)) : '';

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
		if (!title || !newDatetime) return;
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
			pickDate = '';
			pickTime = '';
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
		// Odoo stores UTC "YYYY-MM-DD HH:MM:SS" — append Z so it parses as UTC, then
		// toLocaleString renders it in the user's local timezone.
		const iso = odooDatetime.replace(' ', 'T') + 'Z';
		return new Date(iso).toLocaleString(undefined, {
			weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
				/>

				<div class="rw-presets">
					<button type="button" class="chip" on:click={() => presetIn(1)}>+1 hour</button>
					<button type="button" class="chip" on:click={() => presetIn(3)}>+3 hours</button>
					<button type="button" class="chip" on:click={() => presetToday(18)}>This evening</button>
					<button type="button" class="chip" on:click={() => presetTomorrow(9)}>Tomorrow 9 AM</button>
					<button type="button" class="chip" on:click={() => presetTomorrow(18)}>Tomorrow eve</button>
				</div>

				<div class="rw-datetime">
					<input class="rinput" type="date" bind:value={pickDate} aria-label="date" />
					<input class="rinput" type="time" bind:value={pickTime} aria-label="time" />
				</div>

				{#if newDatetime}
					<p class="rw-preview">Fires: {formatDatetime(newDatetime)}</p>
				{/if}
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
	.rw-presets {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chip {
		padding: 6px 11px;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	.chip:hover {
		color: var(--teal);
		border-color: var(--teal);
	}
	.rw-datetime {
		display: flex;
		gap: 8px;
	}
	.rw-datetime .rinput {
		flex: 1;
		min-width: 0;
	}
	.rw-preview {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--teal);
		margin: 0;
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
