# Daily Tracker

A daily ibadah & productivity tracker built with SvelteKit (static SPA / installable PWA).
Track your five daily prayers — Jamāʻah and Sunnah for each — plus exercise, book
reading, and Qurʻan reading toward daily targets, with a live progress ring and a
seven-day overview.

Built on the **svelte-odoo-pwa** pattern. It's a multi-tenant SaaS: users sign
up and log in, each signup provisions its own Odoo **company + user**, and every
user's habit data, notes, and journal live in an Odoo Studio model
(`x_dailytracker`) isolated by Odoo's multi-company record rules. All Odoo
traffic goes through a server-side proxy, and the login session lives in a
secure httpOnly cookie — credentials never reach the browser.

## Setup

1. Copy `.env.example` to `.env`. **`ODOO_USERNAME` / `ODOO_API_KEY` must be an
   Odoo administrator** — they're used at signup to create the company + user
   (and nothing else; data access uses each user's own session):

   ```env
   ODOO_URL=https://your-instance.odoo.com
   ODOO_DB=your-database-name
   ODOO_USERNAME=admin-username
   ODOO_API_KEY=admin-api-key          # My Profile → Account Security → New API Key
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

## Accounts & multi-tenant isolation (required Odoo setup)

Signup creates a real Odoo company + user; login uses that user's web session.
For this to work and to keep each tenant's data private, configure Odoo:

1. **Enable multi-company.** Settings → Users & Companies must allow multiple
   companies. The `ODOO_USERNAME` API user needs administrator rights (it must be
   able to create `res.company` and `res.users`). Each signup consumes an Odoo
   user seat — on Odoo Online that is a billable internal user.
2. **Add `company_id` to `x_dailytracker`.** In Studio, make the model
   company-specific (adds a `company_id` Many2one to `res.company`). New records
   default to the creating user's company.
3. **Add a record rule** on `x_dailytracker`:
   `['company_id', 'in', company_ids]` (global, or for the Internal User group).
   Without this rule, users could read each other's rows.
4. **Grant access rights.** Give the *Internal User* group read/write/create/
   delete access (ir.model.access) on `x_dailytracker`, so new users can use it.
5. **Auth endpoints** (`/api/auth/signup|login|logout|me`) use Odoo's web session
   API (`/web/session/authenticate`, `/web/dataset/call_kw`). The session id is
   stored in an httpOnly cookie (`app_session`), valid 30 days.

> Security: open signup creates Odoo users with the admin key. Before going
> public, gate `/api/auth/signup` with a CAPTCHA, invite code, or rate limit to
> prevent abuse and runaway seat usage. Odoo password policy applies to new
> users (min length is enforced both client- and Odoo-side).

## Routes

```
/             dashboard (requires login; redirects to /login otherwise)
/login        sign in / sign up (toggle)
/api/auth/*   signup · login · logout · me   (session cookie)
/api/odoo     data proxy — runs as the logged-in user
```

Production build:

```bash
npm run build    # builds via @sveltejs/adapter-vercel
npm run preview  # serve the production build locally
```

## Deploying to Vercel

The app uses **`@sveltejs/adapter-vercel`** because the `/api/odoo` route must run
server-side (a static adapter can't deploy it — that's what caused the failed
build). Vercel serves the prerendered page shell statically and runs the proxy
as a serverless function.

1. Import the repo into Vercel (it auto-detects SvelteKit — no `vercel.json`
   needed).
2. **Set the Odoo credentials as Environment Variables** in the Vercel project
   (Settings → Environment Variables). These are *not* committed (`.env` is
   gitignored), so the deploy needs them or the API returns "not configured":

   | Name | Example |
   |---|---|
   | `ODOO_URL` | `https://your-instance.odoo.com` |
   | `ODOO_DB` | `your-database-name` |
   | `ODOO_USERNAME` | `your-username` |
   | `ODOO_API_KEY` | `your-api-key` |
   | `ODOO_MODEL` | `x_dailytracker` |

   Add them to Production (and Preview if you use preview deploys), then redeploy.
3. Make sure your Odoo instance allows requests from the Vercel domain if you
   have IP/origin restrictions.

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
