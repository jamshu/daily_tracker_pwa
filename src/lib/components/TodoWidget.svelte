<script>
	import { base } from '$app/paths';

	let todos = [];
	let loading = true;
	let adding = false;
	let newTitle = '';
	let pickDate = '';
	let busy = false;
	let error = '';

	const pad = (n) => String(n).padStart(2, '0');

	function ymd(d) {
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}

	function presetToday() {
		pickDate = ymd(new Date());
	}
	function presetTomorrow() {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		pickDate = ymd(d);
	}
	function presetNextWeek() {
		const d = new Date();
		d.setDate(d.getDate() + 7);
		pickDate = ymd(d);
	}

	$: open = todos.filter((t) => !t.x_studio_done);
	$: done = todos.filter((t) => t.x_studio_done);

	async function load() {
		try {
			const res = await fetch(`${base}/api/todos`);
			if (!res.ok) return;
			const d = await res.json();
			todos = d.todos ?? [];
		} catch { /* ignore */ } finally {
			loading = false;
		}
	}

	async function addTodo() {
		const title = newTitle.trim();
		if (!title) return;
		busy = true;
		error = '';
		try {
			const res = await fetch(`${base}/api/todos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'add', title, date: pickDate || '' })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || !d.ok) throw new Error(d.error || 'Failed');
			adding = false;
			newTitle = '';
			pickDate = '';
			await load();
		} catch (e) {
			error = e.message;
		} finally {
			busy = false;
		}
	}

	async function toggleTodo(t) {
		// Optimistic flip
		const next = !t.x_studio_done;
		todos = todos.map((x) => (x.id === t.id ? { ...x, x_studio_done: next } : x));
		try {
			await fetch(`${base}/api/todos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggle', id: t.id })
			});
		} catch {
			await load(); // revert from server on failure
		}
	}

	async function deleteTodo(id) {
		error = '';
		try {
			const res = await fetch(`${base}/api/todos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'delete', id })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || !d.ok) throw new Error(d.error || 'Failed to delete');
			todos = todos.filter((t) => t.id !== id);
		} catch (e) {
			error = e.message;
			await load(); // revert to the authoritative server list
		}
	}

	// Friendly relative label for a due date. `overdue` true if past and still open.
	// Odoo Date field gives "YYYY-MM-DD" — parse as a local calendar date.
	function dueLabel(dateStr) {
		if (!dateStr) return null;
		const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
		const due = new Date(y, m - 1, d);
		const d0 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
		const now = new Date();
		const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const days = Math.round((d0 - n0) / 86_400_000);
		let text;
		if (days === 0) text = 'Today';
		else if (days === 1) text = 'Tomorrow';
		else if (days === -1) text = 'Yesterday';
		else text = due.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
		return { text, overdue: days < 0 };
	}

	load();
</script>

<div class="todo-widget">
	<div class="widget-header">
		<span class="widget-title">Todo</span>
	</div>

	{#if loading}
		<p class="tw-empty">Loading…</p>
	{:else}
		{#each open as t (t.id)}
			{@const due = dueLabel(t.x_studio_due_date)}
			<div class="todo-row">
				<button class="check" type="button" on:click={() => toggleTodo(t)} aria-label="complete todo"></button>
				<span class="tname">{t.x_name}</span>
				{#if due}
					<span class="due" class:overdue={due.overdue}>{due.text}</span>
				{/if}
				<button class="del-todo" type="button" on:click={() => deleteTodo(t.id)} aria-label="delete todo">
					<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}

		{#if open.length === 0 && !adding}
			<p class="tw-empty">No todos yet.</p>
		{/if}

		{#if adding}
			<div class="tw-form">
				<div class="tw-top-row">
					<input
						class="tinput"
						type="text"
						placeholder="What needs doing?"
						bind:value={newTitle}
						maxlength="60"
						autofocus
						on:keydown={(e) => e.key === 'Enter' && addTodo()}
					/>
					<input class="tinput tdate" type="date" bind:value={pickDate} aria-label="due date" />
				</div>

				<div class="tw-presets">
					<button type="button" class="chip" on:click={presetToday}>Today</button>
					<button type="button" class="chip" on:click={presetTomorrow}>Tomorrow</button>
					<button type="button" class="chip" on:click={presetNextWeek}>Next week</button>
					<button type="button" class="chip" on:click={() => (pickDate = '')}>No date</button>
				</div>

				{#if error}<p class="tw-err">{error}</p>{/if}
				<div class="tw-actions">
					<button class="tw-add-btn" type="button" disabled={busy || !newTitle.trim()} on:click={addTodo}>
						{busy ? 'Adding…' : 'Add'}
					</button>
					<button class="tw-cancel-btn" type="button" on:click={() => { adding = false; error = ''; }}>Cancel</button>
				</div>
			</div>
		{:else}
			<button class="tw-new" type="button" on:click={() => (adding = true)}>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 5v14M5 12h14" />
				</svg>
				Add todo
			</button>
		{/if}

		{#if done.length}
			<div class="done-header">Done</div>
			{#each done as t (t.id)}
				<div class="todo-row done">
					<button class="check checked" type="button" on:click={() => toggleTodo(t)} aria-label="reopen todo">
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 6 9 17l-5-5" />
						</svg>
					</button>
					<span class="tname struck">{t.x_name}</span>
					<button class="del-todo" type="button" on:click={() => deleteTodo(t.id)} aria-label="delete todo">
						<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/each}
		{/if}
	{/if}
</div>

<style>
	.todo-widget {
		display: flex;
		flex-direction: column;
		/* Clip full-width rows' square corners to the card radius so nothing
		   pokes past the rounded border on any phone. */
		overflow: hidden;
		border-radius: var(--radius);
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
	.todo-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
	}
	.todo-row:last-of-type {
		border-bottom: none;
	}
	.check {
		flex: 0 0 auto;
		width: 24px;
		height: 24px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		border: 2px solid var(--text-faint);
		color: #042f2a;
		transition: all 0.18s ease;
	}
	.check:hover {
		border-color: var(--green);
	}
	.check.checked {
		background: var(--green);
		border-color: var(--green);
	}
	.tname {
		flex: 1;
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text);
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tname.struck {
		text-decoration: line-through;
		color: var(--text-faint);
	}
	.due {
		flex: 0 0 auto;
		font-size: 0.74rem;
		font-weight: 600;
		color: var(--text-faint);
		padding: 3px 9px;
		border-radius: 999px;
		background: var(--surface-2);
		border: 1px solid var(--border);
	}
	.due.overdue {
		color: var(--red);
		border-color: color-mix(in srgb, var(--red) 40%, transparent);
		background: color-mix(in srgb, var(--red) 10%, transparent);
	}
	.del-todo {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		color: var(--text-faint);
		flex: 0 0 auto;
		transition: all 0.15s ease;
	}
	.del-todo:hover {
		color: var(--red);
		background: color-mix(in srgb, var(--red) 12%, transparent);
	}
	.tw-empty {
		padding: 10px 14px;
		font-size: 0.84rem;
		color: var(--text-faint);
		margin: 0;
	}
	.done-header {
		padding: 12px 14px 4px;
		font-size: 0.74rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-faint);
		border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
	}
	.tw-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 14px;
		border-top: 1px solid var(--border);
	}
	.tinput {
		width: 100%;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--teal);
		background: var(--bg-soft);
		color: var(--text);
		font-family: inherit;
		/* 16px min — anything smaller makes iOS Safari auto-zoom on focus and
		   never zoom back out. */
		font-size: 16px;
	}
	.tinput:focus {
		outline: none;
	}
	.tw-top-row {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}
	.tw-top-row .tinput {
		flex: 1 1 150px;
		min-width: 0;
	}
	/* Native date control reports a large min intrinsic width on mobile (Android
	   Chrome / iOS Safari) that ignores max-width/flex-shrink and pushes the row
	   past the card → horizontal page scroll. Let the row wrap instead: the date
	   drops to its own full-width line when it can't fit beside the title. */
	.tdate {
		flex: 1 1 140px;
		width: auto;
		min-width: 0;
		max-width: 100%;
		-webkit-appearance: none;
		appearance: none;
		font-size: 16px;
		padding: 7px 9px;
	}
	.tw-presets {
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
	.tw-err {
		font-size: 0.82rem;
		color: var(--red);
		margin: 0;
	}
	.tw-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.tw-add-btn {
		padding: 7px 16px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.84rem;
		color: #042f2a;
		background: var(--teal);
		flex: 1 1 auto;
	}
	.tw-add-btn:disabled {
		opacity: 0.5;
	}
	.tw-cancel-btn {
		padding: 7px 12px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.84rem;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		flex: 0 1 auto;
	}
	.tw-new {
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
	.tw-new:hover {
		color: var(--teal);
	}
</style>
