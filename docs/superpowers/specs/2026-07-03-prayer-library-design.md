# Prayers & Dhikr Library — Design

**Date:** 2026-07-03
**Status:** Approved

## Problem

The home page has three separate `dhikr-link` buttons — Dhikr after Salah, Janaza Prayer, Protective Recitations — and each new prayer or dua would add another button, crowding the home screen. There is no single place to browse all prayer/dhikr content.

## Goal

One "Prayers & Dhikr" library page listing all collections, extensible so future prayers and duas are added as data, not new UI. The home screen keeps one-tap access to the most-used daily item (Dhikr after Salah) plus a single library entry point.

## Decisions (confirmed with user)

- Library contains the 3 current collections: Dhikr after Salah, Janaza Prayer, Protective Recitations. Morning/Evening Adhkār stay reachable from the Daily Deeds info icons only.
- ~~Every library item opens as a full page: Janaza switches from the popup modal to the immersive `/adhkar/janaza` reader.~~ **Amended during execution:** Janaza keeps its popup modal — it presents the separate male/female versions of the duas. Library entries therefore carry either `href` (page) or `modal` (ADHKAR set key). Protective Recitations keeps its `/recitations` page.
- Home page keeps the "Dhikr after Salah" button and gains a "Prayers & Dhikr" library button; the Janaza and Protective Recitations buttons are removed.

## Design

### 1. Library data — `src/lib/adhkar.js`

Export `PRAYER_LIBRARY`: an array of `{ id, title, subtitle, icon, href }` (href is app-relative, `base` prepended at render). Initial entries:

| id | title | opens via |
|---|---|---|
| afterSalah | Dhikr after Salah | `href: /adhkar/afterSalah` |
| janaza | Janaza Prayer | `modal: janaza` (popup, male/female duas) |
| recitations | Protective Recitations | `href: /recitations` |

`icon` is an array of SVG path `d` strings (some icons use two paths), taken from the markup currently inlined per button on the home page. Adding a future item = one entry here (+ a set in `ADHKAR` if it uses the reader).

### 2. Shared row component — `src/lib/components/LibraryLink.svelte`

Extracts the ~30-line `dhikr-link` button markup (icon circle, title + subtitle, chevron) repeated three times in `src/routes/+page.svelte`. Props: `title`, `subtitle`, `icon` (path data), optional `fadeDelay`; dispatches/handles click via `on:click` forwarding. Owns the `dhikr-link` styles.

### 3. New route — `src/routes/prayers/+page.svelte`

"Prayers & Dhikr" page: subpage header with back-to-home button (match existing subpage pattern, e.g. `/recitations` header), then one `LibraryLink` per `PRAYER_LIBRARY` entry navigating with `goto(base + href)`.

### 4. Home page — `src/routes/+page.svelte`

- Keep "Dhikr after Salah" as a `LibraryLink` (from the `afterSalah` library entry).
- Remove the Janaza and Protective Recitations buttons.
- Add a "Prayers & Dhikr" `LibraryLink` → `goto(base + '/prayers')`.
- `AdhkarModal` import/usage stays (Daily Deeds info icons still open modal guides).

### 5. Enablers

- `src/routes/adhkar/[set]/+page.svelte` and `src/routes/recitations/+page.svelte`: back action uses `history.back()` when there is in-app history, falling back to `goto(base + '/')`, so both readers return to the library when opened from it. (The janaza prerender entry was dropped with the modal amendment.)
- `src/routes/prayers/+page.svelte` mounts `<AdhkarModal />` so modal entries open in place.

## Error handling

No new failure modes: all content is static module data; navigation only. Unknown `[set]` params behave as today.

## Testing

Manual (no browser-test infra in repo): from home, open the library, open each of the 3 items, verify back returns to the library; verify home still opens Dhikr after Salah directly; verify Daily Deeds info icons still open their guides; `npm run build` compiles (Svelte compile + prerender entries).
