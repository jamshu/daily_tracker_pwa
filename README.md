# Daily Tracker

A daily ibadah & productivity tracker built with SvelteKit (static SPA / installable PWA).
Track your five daily prayers — Jamāʻah and Sunnah for each — plus exercise, book
reading, and Qurʻan reading toward daily targets, with a live progress ring and a
seven-day overview.

Built on the **svelte-odoo-pwa** pattern. Habit data, notes, and a journal are
stored in an Odoo Studio model (`x_dailytracker`) over JSON-RPC, through a
server-side proxy so credentials never reach the browser. The offline-write sync
queue from the skill is intentionally omitted — it isn't needed here.

## Setup

1. Copy `.env.example` to `.env` and fill in your Odoo details:

   ```env
   ODOO_URL=https://your-instance.odoo.com
   ODOO_DB=your-database-name
   ODOO_USERNAME=your-username
   ODOO_API_KEY=your-api-key          # My Profile → Account Security → New API Key
   ODOO_MODEL=x_dailytracker
   ```

2. Run it:

   ```bash
   npm install
   npm run dev      # http://localhost:5173
   ```

The proxy runs as a SvelteKit server route, so use `npm run dev` (or a server
host — Vercel/Render/Node) — a pure static export can't run `/api/odoo`. If
`.env` is missing, the app loads but the first Odoo call returns a clear
"not configured" error.

## Odoo model (`x_dailytracker`)

One record per day. Expected fields:

| Field | Type | Holds |
|---|---|---|
| `x_name` | Char | Display name (`Daily Tracker YYYY-MM-DD`) |
| `x_studio_date` | Date | The day — the lookup key |
| `x_studio_json` | Text (multiline) | `{ prayers, activities, deeds }` as JSON |
| `x_studio_notes` | Html | Notes editor content |
| `x_studio_journal` | Html | Journal editor content |

On load the app reads the last 35 days; edits debounce-save (create the record
the first time a day is touched, update it thereafter).

Build a static bundle (deployable to any static host):

```bash
npm run build    # outputs to build/
npm run preview  # serve the production build locally
```

## What's tracked

- **Prayers** — Fajr, Dhuhr, Asr, Maghrib, Isha. Each has a *Jamāʻah* toggle and
  a *Sunnah* toggle (10 marks total).
- **Activities** — Exercise (30 min), Read Books (20 min), Read Qurʻan (5 pages).
  Adjust the targets in `src/lib/config.js`.
- **Daily deeds** — Morning Adhkār, Evening Adhkār, Sadaqah (one mark each).
- **Notes & Journal** — free-text editors per day, saved to Odoo HTML fields.
- **Daily progress** — a single percentage over prayers + activities + deeds
  (16 marks). Use the date arrows or the week strip to view and edit past days.

All data lives in Odoo. Edits save automatically (debounced); a small header
indicator shows Saving / Saved / Offline.

## Project layout

```
src/
  routes/
    +layout.js          # SPA mode: ssr=false, csr=true, prerender shell
    +layout.svelte      # global styles
    +page.svelte        # the dashboard
    api/odoo/+server.js # Odoo JSON-RPC proxy (credentials live only here)
  lib/
    config.js           # prayer/activity/deed definitions, targets, progress math
    store.js            # Odoo-backed Svelte store (load + debounced save)
    odoo.js             # browser Odoo client (calls /api/odoo)
    components/         # ProgressRing, PrayerCard, ActivityCard, DeedToggle,
                        # QuoteCard, NotesCard, DateNav, WeekStrip
static/                 # icons + favicon + PWA manifest assets
```

## How the sync works

- `store.js` loads the last 35 days from `x_dailytracker` on startup and keeps an
  in-memory map keyed by date. Edits update memory immediately, then debounce a
  create/update back to Odoo (~0.7 s). The first edit on a day creates its record.
- The Odoo API key goes in the *password* position of the JSON-RPC calls; the
  proxy caches the authenticated uid. Credentials are read with
  `$env/dynamic/private` and never reach the browser.
- Notes/Journal are edited with a lightweight rich-text editor (bold, italic,
  headings, bullet/numbered lists) and stored as HTML directly in the Odoo HTML
  fields, so the formatting renders the same in Odoo.

## Notes

- Installable: served over HTTPS (or localhost) with a valid manifest + icons,
  the browser offers "Install app".
- The motivational quote is fetched at runtime from a free public API
  (`dummyjson.com/quotes/random`) with a built-in fallback list.
