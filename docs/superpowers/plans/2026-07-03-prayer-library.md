# Prayers & Dhikr Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three home-page prayer buttons with a "Dhikr after Salah" shortcut plus a "Prayers & Dhikr" button opening a new extensible library page at `/prayers`.

**Architecture:** Library entries live as data (`PRAYER_LIBRARY` in `src/lib/adhkar.js`); a shared `LibraryLink.svelte` row component (extracted from the home page's repeated `dhikr-link` button markup) renders them on both the home page and the new `/prayers` route. Janaza switches from popup modal to the immersive `/adhkar/janaza` reader.

**Tech Stack:** SvelteKit 2 / Svelte 5 in **legacy syntax** (`on:click`, `$:`, `export let` — no runes), `node --test` for lib tests, no component-test infra.

**Spec:** `docs/superpowers/specs/2026-07-03-prayer-library-design.md`

## Global Constraints

- Svelte files use tabs for indentation and legacy (non-runes) syntax, matching the rest of the repo.
- All navigation must prefix `base` from `$app/paths`: `goto(`${base}${href}`)`.
- `href` values in `PRAYER_LIBRARY` are app-relative (start with `/`), `base` is prepended at render time.
- Build check on this Windows machine: `npm run build` must print `✓ built in …s` for both server and client bundles. The `EPERM: symlink` error from the Vercel adapter **after** that line is a pre-existing Windows limitation — ignore it; any **Svelte compile error** is a failure.
- Lib tests: `node --test src/lib/*.test.mjs` — all pass before every commit.
- The `.fade-in` class and `--fade-delay` var are global (src/app.css:318) and usable from components.

---

### Task 1: `PRAYER_LIBRARY` data in adhkar.js

**Files:**
- Modify: `src/lib/adhkar.js` (append at end of file)
- Test: `src/lib/adhkar.test.mjs` (create)

**Interfaces:**
- Consumes: existing `ADHKAR` export in `src/lib/adhkar.js`.
- Produces: `export const PRAYER_LIBRARY` — array of `{ id: string, title: string, subtitle: string, icon: string[], href: string }`. Order: afterSalah, janaza, recitations. Tasks 2 and 3 import it.

- [ ] **Step 1: Write the failing test**

Create `src/lib/adhkar.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRAYER_LIBRARY, ADHKAR } from './adhkar.js';

test('PRAYER_LIBRARY lists the three collections with complete display data', () => {
	assert.deepEqual(
		PRAYER_LIBRARY.map((e) => e.id),
		['afterSalah', 'janaza', 'recitations']
	);
	for (const e of PRAYER_LIBRARY) {
		assert.ok(e.title.length, `${e.id} has a title`);
		assert.ok(e.subtitle.length, `${e.id} has a subtitle`);
		assert.ok(Array.isArray(e.icon) && e.icon.length, `${e.id} has icon path(s)`);
		assert.ok(e.href.startsWith('/'), `${e.id} href is app-relative`);
	}
});

test('reader-based library entries have a matching ADHKAR set', () => {
	for (const e of PRAYER_LIBRARY) {
		const m = e.href.match(/^\/adhkar\/(.+)$/);
		if (m) assert.ok(ADHKAR[m[1]], `ADHKAR has set '${m[1]}'`);
	}
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/adhkar.test.mjs`
Expected: FAIL — `SyntaxError: The requested module './adhkar.js' does not provide an export named 'PRAYER_LIBRARY'`

- [ ] **Step 3: Implement — append to `src/lib/adhkar.js`**

```js
/* ----------------------------- prayer library ---------------------------- */
// Entries for the "Prayers & Dhikr" library page (/prayers) and the home-page
// shortcut. href is app-relative (base prepended at render); icon is a list of
// SVG path `d` strings drawn in a 24×24 stroked viewBox. Future prayers/duas:
// add an entry here (plus an ADHKAR set above if it opens in the reader).
export const PRAYER_LIBRARY = [
	{
		id: 'afterSalah',
		title: 'Dhikr after Salah',
		subtitle: 'The remembrance to recite after every fard prayer',
		icon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z'],
		href: '/adhkar/afterSalah'
	},
	{
		id: 'janaza',
		title: 'Janaza Prayer',
		subtitle: '4 Takbeers — duas for the funeral prayer',
		icon: ['M12 2L8 7H4l2 5-4 5h5l5 5 5-5h5l-4-5 2-5h-4L12 2z'],
		href: '/adhkar/janaza'
	},
	{
		id: 'recitations',
		title: 'Protective Recitations',
		subtitle: 'Ayatul Kursi & the three Quls — Ikhlās, Falaq, Nās',
		icon: ['M12 22s-8-4.5-8-11.5V5l8-3 8 3v5.5C20 17.5 12 22 12 22z', 'M9 11l2 2 4-4'],
		href: '/recitations'
	}
];
```

(Titles, subtitles and icon paths are copied verbatim from the three buttons at `src/routes/+page.svelte:401-445`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/lib/*.test.mjs`
Expected: all PASS (existing suites + 2 new tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/adhkar.js src/lib/adhkar.test.mjs
git commit -m "feat: add PRAYER_LIBRARY data for the prayers page"
```

---

### Task 2: `LibraryLink` component + home page swap

**Files:**
- Create: `src/lib/components/LibraryLink.svelte`
- Modify: `src/routes/+page.svelte` (buttons at lines 401-445, CSS at lines 855-911, imports)

**Interfaces:**
- Consumes: `PRAYER_LIBRARY` from Task 1; global `.fade-in` CSS.
- Produces: `LibraryLink.svelte` with props `title: string`, `subtitle: string`, `icon: string[]`, `fadeDelay: number` (seconds), forwarding `on:click`. Task 3 uses it identically.

- [ ] **Step 1: Create `src/lib/components/LibraryLink.svelte`**

Markup and styles are moved verbatim from `src/routes/+page.svelte` (one button instance + the `.dhikr-link`/`.dl-*` style block):

```svelte
<script>
	// Tappable library row: icon circle, title + subtitle, chevron.
	export let title;
	export let subtitle;
	export let icon = []; // SVG path `d` strings, 24×24 stroked viewBox
	export let fadeDelay = 0; // seconds, staggers the global fade-in
</script>

<button class="dhikr-link fade-in" style="--fade-delay:{fadeDelay}s" on:click>
	<span class="dl-icon">
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			{#each icon as d}
				<path {d} />
			{/each}
		</svg>
	</span>
	<span class="dl-text">
		<strong>{title}</strong>
		<small>{subtitle}</small>
	</span>
	<svg class="dl-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M9 18l6-6-6-6" />
	</svg>
</button>

<style>
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
	@media (hover: hover) {
		.dhikr-link:hover {
			border-color: var(--teal);
			transform: translateY(-1px);
		}
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
		color: var(--on-accent);
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
</style>
```

- [ ] **Step 2: Swap the three buttons in `src/routes/+page.svelte`**

In the `<script>` block: add to the existing `$lib/adhkar.js` import line (currently `import { openAdhkar } from '$lib/adhkar.js';`):

```js
import { openAdhkar, PRAYER_LIBRARY } from '$lib/adhkar.js';
import LibraryLink from '$lib/components/LibraryLink.svelte';
```

and below the imports add:

```js
// Home-page shortcut: the most-used daily collection, straight from the library data.
const afterSalah = PRAYER_LIBRARY.find((e) => e.id === 'afterSalah');
```

Replace the entire three-`<button class="dhikr-link ...">` block (lines 401-445, between the prayers `</div>` and the `Voluntary Prayers` heading) with:

```svelte
<LibraryLink
	title={afterSalah.title}
	subtitle={afterSalah.subtitle}
	icon={afterSalah.icon}
	fadeDelay={0.16}
	on:click={() => goto(`${base}${afterSalah.href}`)}
/>

<LibraryLink
	title="Prayers & Dhikr"
	subtitle="Janaza, protective recitations and more — the full library"
	icon={['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z']}
	fadeDelay={0.17}
	on:click={() => goto(`${base}/prayers`)}
/>
```

Keep `AdhkarModal` and `openAdhkar` — the Daily Deeds info handler (line 465) still uses them.

- [ ] **Step 3: Delete the now-unused styles from `src/routes/+page.svelte`**

Remove the whole block from `.dhikr-link {` through `.dl-chev { … }` (lines 855-911). Do not remove the `@media (max-width: 520px)` block that follows.

- [ ] **Step 4: Verify build and tests**

Run: `npm run build` → Expected: `✓ built in …s` twice, no Svelte compile errors, and **no "Unused CSS selector" warnings for `.dhikr-link`/`.dl-*` in `+page.svelte`** (there would be some if Step 3 was missed).
Run: `node --test src/lib/*.test.mjs` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/LibraryLink.svelte src/routes/+page.svelte
git commit -m "feat: extract LibraryLink and consolidate home prayer buttons"
```

---

### Task 3: `/prayers` library page

**Files:**
- Create: `src/routes/prayers/+page.svelte`

**Interfaces:**
- Consumes: `PRAYER_LIBRARY` (Task 1), `LibraryLink` (Task 2).
- Produces: the `/prayers` route the home button navigates to.

- [ ] **Step 1: Create `src/routes/prayers/+page.svelte`**

Header pattern (`.wrap`/`.bar`/`.back`/`.spacer`) copied from `src/routes/report/+page.svelte:85-90,199-229`:

```svelte
<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { PRAYER_LIBRARY } from '$lib/adhkar.js';
	import LibraryLink from '$lib/components/LibraryLink.svelte';
</script>

<svelte:head><title>Prayers & Dhikr — Daily Deed Tracker</title></svelte:head>

<div class="wrap">
	<header class="bar">
		<button class="back" on:click={() => goto(`${base}/`)} aria-label="back">‹</button>
		<h1>Prayers & Dhikr</h1>
		<span class="spacer"></span>
	</header>

	<p class="intro fade-in">Prayers, adhkār and duas — tap any to open.</p>

	{#each PRAYER_LIBRARY as entry, i (entry.id)}
		<LibraryLink
			title={entry.title}
			subtitle={entry.subtitle}
			icon={entry.icon}
			fadeDelay={0.06 + i * 0.05}
			on:click={() => goto(`${base}${entry.href}`)}
		/>
	{/each}
</div>

<style>
	.wrap {
		max-width: var(--maxw, 560px);
		margin: 0 auto;
		padding: calc(12px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px))
			calc(48px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px));
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}
	.back {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		font-size: 1.6rem;
		line-height: 1;
		color: var(--text-dim);
		background: var(--bg-soft);
		border: 1px solid var(--border);
	}
	.bar h1 {
		flex: 1;
		text-align: center;
		font-size: 1.2rem;
		font-weight: 800;
	}
	.spacer {
		width: 36px;
	}
	.intro {
		color: var(--text-dim);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
```

(Row spacing comes from `LibraryLink`'s own `margin-top: 26px`.)

- [ ] **Step 2: Verify build**

Run: `npm run build` → Expected: `✓ built in …s`, no compile errors, `/prayers` appears in the prerendered/built routes output.

- [ ] **Step 3: Commit**

```bash
git add src/routes/prayers/+page.svelte
git commit -m "feat: add Prayers & Dhikr library page"
```

---

### Task 4: Reader enablers — janaza prerender + history-aware back

**Files:**
- Modify: `src/routes/adhkar/[set]/+page.js`
- Modify: `src/routes/adhkar/[set]/+page.svelte` (lines 89-93 `onKey`, line 109 back button)
- Modify: `src/routes/recitations/+page.svelte` (line 71 back button)

**Interfaces:**
- Consumes: nothing new.
- Produces: `/adhkar/janaza` prerenders; back from the reader and from `/recitations` returns to the page you came from (library or home).

- [ ] **Step 1: Add janaza to prerender entries**

In `src/routes/adhkar/[set]/+page.js` change the return to:

```js
export function entries() {
	return [{ set: 'morning' }, { set: 'evening' }, { set: 'afterSalah' }, { set: 'janaza' }];
}
```

- [ ] **Step 2: History-aware back in `src/routes/adhkar/[set]/+page.svelte`**

Add next to the other functions in the `<script>` block:

```js
// Return to wherever the reader was opened from (home or the prayer library);
// fall back to home on a cold deep-link with no in-app history.
function back() {
	if (history.length > 1) history.back();
	else goto(`${base}/`);
}
```

Replace `goto(`${base}/`)` with `back()` in **two** places:
- the `Escape` branch of `onKey` (line 92): `else if (e.key === 'Escape') back();`
- the header back button (line 109): `on:click={back}`

Leave the `onMount` unsupported-set redirect (line 49) as a direct `goto(`${base}/`)`.

- [ ] **Step 2b: Same history-aware back in `src/routes/recitations/+page.svelte`**

Add the identical `back()` function to its `<script>` block (it already imports `goto` and `base`):

```js
// Return to wherever this page was opened from (home or the prayer library);
// fall back to home on a cold deep-link with no in-app history.
function back() {
	if (history.length > 1) history.back();
	else goto(`${base}/`);
}
```

and change the header back button (line 71) to `on:click={back}`.

- [ ] **Step 3: Verify build and tests**

Run: `npm run build` → Expected: `✓ built in …s`; prerender output includes `/adhkar/janaza`.
Run: `node --test src/lib/*.test.mjs` → Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/routes/adhkar/[set]/+page.js" "src/routes/adhkar/[set]/+page.svelte" src/routes/recitations/+page.svelte
git commit -m "feat: prerender janaza reader and make back history-aware"
```

---

### Task 5: Runtime smoke check

**Files:** none (verification only)

- [ ] **Step 1: Serve and probe the new route**

```bash
npm run dev &   # or run_in_background
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/prayers      # expect 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/adhkar/janaza # expect 200
```

(Auth gating means SSR renders the boot shell; a 200 with no 500 stack confirms the routes mount. Full flow — home → library → each item → back — needs a logged-in browser; hand to the user or the /verify skill.)

- [ ] **Step 2: Manual UAT checklist (user, in the PWA)**

1. Home shows exactly two rows: "Dhikr after Salah" and "Prayers & Dhikr".
2. "Prayers & Dhikr" opens the library with 3 rows.
3. Janaza opens the immersive reader (not the popup) and back returns to the library.
4. Protective Recitations opens `/recitations`; back/Escape returns to the library.
5. Daily Deeds info icons still open their adhkār guides.
