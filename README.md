# Daily Tracker (Local)

A daily ibadah & productivity tracker built with SvelteKit + Capacitor — **fully
local**: no server, no accounts. All data (prayers, activities, deeds, notes,
budget, expenses, todos, settings) lives on the device — in a JSON file under
the app's data directory on iOS/Android, or localStorage in a browser.

Also an **offline PWA**: the whole static build is precached by a service
worker (`@vite-pwa/sveltekit`), so hosting it anywhere static (e.g. Vercel) and
installing from the browser gives an app that opens and works with no internet.
Note: the daily reminder notification only works in the Capacitor native
builds — browsers can't schedule local notifications while the app is closed.

Fork of the Odoo-backed Daily Tracker with signup/login, leaderboard, groups,
and server push removed. A daily "log your day" reminder is scheduled on-device
via Capacitor Local Notifications, and Settings has JSON export/import for
backups.

## Develop

```bash
npm install
npm run dev        # browser dev (localStorage persistence)
```

## Build the apps

```bash
npm run build      # static site → build/
npx cap sync       # copy into ios/ and android/
npx cap open ios   # Xcode → run on device
npx cap open android
```

App ID: `com.dailytracker.local` — installs alongside the original Daily Deed
Tracker app.

## Data & backup

- Native: `dailytracker-db.json` in the app data directory (`Directory.Data`),
  bill images as separate `bill-<id>.txt` files. Persisted with a short debounce
  plus an immediate flush when the app goes to background.
- Web: localStorage (`dtl_db`, `dtl_bill_<id>`).
- Settings → Backup: export shares/downloads a full JSON backup (bill images
  inlined); import replaces everything and reloads.

## Tests

```bash
node --test src/lib/*.test.mjs
```
