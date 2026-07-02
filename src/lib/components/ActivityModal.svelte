<script>
	import {
		activityModal,
		closeActivityModal,
		presets,
		units,
		draft,
		addFromPreset,
		addCustom,
		createUnit
	} from '$lib/activities.js';

	// Group presets by category for the picker list.
	$: grouped = groupByCategory($presets);
	function groupByCategory(list) {
		const m = {};
		for (const p of list) (m[p.category || 'Other'] ??= []).push(p);
		return Object.entries(m);
	}

	// ── goal sub-view working state ──
	let goalValue = '';
	let selectedUnitId = null;
	let customUnit = '';

	function openGoal() {
		const g = $draft.goal;
		goalValue = g ? String(g.value) : '';
		selectedUnitId = g ? g.unitId : $units[0]?.id ?? null;
		customUnit = '';
		activityModal.set('goal');
	}

	async function saveGoal() {
		const value = Math.max(1, Math.round(Number(goalValue) || 0));
		let unitId = selectedUnitId;
		let unitName = $units.find((u) => u.id === unitId)?.name ?? '';
		const custom = customUnit.trim();
		if (custom) {
			const u = await createUnit(custom); // creates + returns { id, name }
			unitId = u.id;
			unitName = u.name;
		}
		if (!unitId) return; // need a unit
		draft.update((d) => ({ ...d, goal: { value, unitId, unitName } }));
		activityModal.set('create');
	}

	function clearGoal() {
		draft.update((d) => ({ ...d, goal: null }));
	}

	let creating = false;
	async function create() {
		const name = $draft.name.trim();
		if (!name || creating) return;
		creating = true;
		try {
			await addCustom($draft);
			closeActivityModal();
		} finally {
			creating = false;
		}
	}

	let picking = false;
	async function pickPreset(p) {
		if (picking) return;
		picking = true;
		try {
			await addFromPreset(p.id);
			closeActivityModal();
		} finally {
			picking = false;
		}
	}

	function onKey(e) {
		if (e.key === 'Escape') closeActivityModal();
	}
</script>

<svelte:window on:keydown={onKey} />

{#if $activityModal}
	<div class="backdrop" on:click={closeActivityModal} role="presentation">
		<div class="sheet" role="dialog" aria-modal="true" on:click|stopPropagation>
			<!-- ── PICKER ── -->
			{#if $activityModal === 'picker'}
				<header>
					<div class="titles"><h2>New activity</h2></div>
					<button class="x" on:click={closeActivityModal} aria-label="close">×</button>
				</header>
				<div class="body">
					<button class="primary" on:click={() => activityModal.set('create')}>
						Create custom activity
					</button>
					{#each grouped as [category, items]}
						<h3 class="cat">{category}</h3>
						<div class="grid">
							{#each items as p (p.id)}
								<button class="chip" on:click={() => pickPreset(p)}>{p.name}</button>
							{/each}
						</div>
					{/each}
				</div>

			<!-- ── CREATE ── -->
			{:else if $activityModal === 'create'}
				<header>
					<button class="back" on:click={() => activityModal.set('picker')} aria-label="back">‹</button>
					<div class="titles"><h2>Create activity</h2></div>
					<button class="x" on:click={closeActivityModal} aria-label="close">×</button>
				</header>
				<div class="body">
					<input class="field" placeholder="Activity name" bind:value={$draft.name} maxlength="60" />
					<button class="row" on:click={openGoal}>
						<span class="row-label">Goal</span>
						<span class="row-val">
							{#if $draft.goal}{$draft.goal.value} {$draft.goal.unitName}{:else}Optional{/if}
							<span class="chev">›</span>
						</span>
					</button>
					{#if $draft.goal}
						<button class="clear" on:click={clearGoal}>Remove goal</button>
					{/if}
					<p class="hint">No goal → a simple done / not-done activity.</p>
					<button class="primary create" disabled={!$draft.name.trim() || creating} on:click={create}>
						Create activity
					</button>
				</div>

			<!-- ── GOAL ── -->
			{:else if $activityModal === 'goal'}
				<header>
					<button class="back" on:click={() => activityModal.set('create')} aria-label="back">‹</button>
					<div class="titles"><h2>Set goal</h2></div>
					<button class="x" on:click={closeActivityModal} aria-label="close">×</button>
				</header>
				<div class="body">
					<label class="lbl">Value</label>
					<input class="field" type="text" inputmode="numeric" placeholder="e.g. 5" bind:value={goalValue} />
					<label class="lbl">Unit</label>
					<div class="grid">
						{#each $units as u (u.id)}
							<button
								class="chip"
								class:active={selectedUnitId === u.id && !customUnit.trim()}
								on:click={() => { selectedUnitId = u.id; customUnit = ''; }}
							>{u.name}</button>
						{/each}
					</div>
					<input class="field" placeholder="Custom unit" bind:value={customUnit} maxlength="20" />
					<button class="primary" disabled={!(Number(goalValue) > 0) || !(selectedUnitId || customUnit.trim())} on:click={saveGoal}>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 80;
		background: rgba(2, 6, 16, 0.62);
		backdrop-filter: blur(3px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		animation: fade 0.2s ease;
	}
	.sheet {
		width: 100%;
		max-width: 560px;
		max-height: 88vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, var(--surface-2), var(--surface));
		border: 1px solid var(--border);
		border-bottom: none;
		border-radius: 22px 22px 0 0;
		box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.5);
		animation: slideup 0.32s cubic-bezier(0.18, 1, 0.4, 1);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 16px 18px 12px;
		border-bottom: 1px solid var(--border);
	}
	.titles {
		flex: 1;
		text-align: center;
	}
	.titles h2 {
		font-size: 1.15rem;
		font-weight: 800;
	}
	.x,
	.back {
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.back {
		font-size: 1.6rem;
	}
	@media (hover: hover) {
		.x:hover,
		.back:hover {
			color: var(--text);
		}
	}
	.body {
		overflow-y: auto;
		padding: 16px 16px calc(24px + env(safe-area-inset-bottom, 0px));
		display: flex;
		flex-direction: column;
		gap: 12px;
		-webkit-overflow-scrolling: touch;
	}
	.primary {
		width: 100%;
		padding: 14px;
		border-radius: 12px;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: #042f2a;
		background: var(--teal);
		border: 1px solid var(--teal);
	}
	.primary:disabled {
		opacity: 0.45;
	}
	.create {
		margin-top: 8px;
	}
	.cat {
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-dim);
		margin: 6px 0 0;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.chip {
		padding: 12px 14px;
		border-radius: 10px;
		font-size: 0.92rem;
		font-weight: 600;
		text-align: left;
		color: var(--text);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.chip.active {
		background: var(--teal);
		border-color: var(--teal);
		color: #042f2a;
	}
	.field {
		width: 100%;
		padding: 13px 14px;
		font-size: 16px; /* ≥16px so iOS Safari doesn't auto-zoom on focus */
		color: var(--text);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		border-radius: 10px;
	}
	.field:focus {
		outline: none;
		border-color: var(--teal);
	}
	.lbl {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-dim);
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px;
		border-radius: 10px;
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.row-label {
		font-weight: 600;
		color: var(--text);
	}
	.row-val {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-dim);
		font-size: 0.92rem;
	}
	.chev {
		font-size: 1.2rem;
	}
	.clear {
		align-self: flex-start;
		font-size: 0.82rem;
		color: var(--red, #ef4444);
		background: none;
		border: none;
		padding: 0;
	}
	.hint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-dim);
	}
	@keyframes fade {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes slideup {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}
</style>
