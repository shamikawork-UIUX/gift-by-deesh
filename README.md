# GiftsByDeesh

Website and admin dashboard for **GiftsByDeesh** (House of Deesh (Pvt) Ltd) — Kinder chocolate bouquets, teddy bears, Hot Wheels sets and custom gift boxes, delivered islandwide in Sri Lanka. Orders are sent to the shop on **WhatsApp** (no online payment yet) and tracked in the dashboard.

- **Website:** Vite + React 18 + TypeScript, React Router, Zustand, plain CSS, `lucide-react` icons
- **Admin dashboard:** `/admin` — orders, products, customers, reminders, team & roles, shop settings, activity log. See **[docs/ADMIN-DASHBOARD.md](docs/ADMIN-DASHBOARD.md)**.
- **Server:** `server/` — zero dependencies (Node's built-in `http` + `node:sqlite`)

Pages: `/` Home · `/shop` Shop Gifts · `/offers` Offers · `/about` About & Contact · `/admin` Dashboard

## Requirements

- Node.js **22.13 or newer** (built-in SQLite). Tested on Node 24.

## Run it locally

```bash
npm install          # first time only
npm run dev          # website + dashboard → http://localhost:5173 (and /admin)
npm run api          # server → http://localhost:8787 (Vite proxies /api and /uploads to it; restarts on changes)
```

Run `dev` and `api` in two terminals. Without the API the shop still renders (built-in catalogue), but orders aren't saved, reminders don't work and the dashboard can't sign in.

First visit to **http://localhost:5173/admin** → create the owner account.

## Production

```bash
npm run build                                          # type-check + build into dist/
NODE_ENV=production SETUP_CODE=choose-a-secret npm start   # site + dashboard + API on one port
```

Needs a host that runs Node (Render, Railway, a VPS…). A static-only host can't run the orders, dashboard or reminders.

| Env var | Default | Purpose |
|---|---|---|
| `PORT` | `8787` | Server port |
| `NODE_ENV` | — | `production` turns on `Secure` cookies and requires `SETUP_CODE` for first-run setup |
| `SETUP_CODE` | — | Code to type on the dashboard's first-run screen to create the owner (required in production) |
| `PUBLIC_ORIGIN` | — | Site URL, e.g. `https://giftsbydeesh.lk`, if a reverse proxy rewrites the Host header |
| `DATA_DIR` | `data/` | Folder for the database and uploaded photos |
| `DB_PATH` | `data/giftsbydeesh.db` | SQLite file |
| `COOKIE_SECURE` | — | `1` forces `Secure` cookies outside production |

`data/` holds orders, customer phone numbers and team accounts. It is **git-ignored — never commit it, and back it up**.

## API

Public (used by the website):

| Method | Path | What |
|---|---|---|
| `GET` | `/api/health` | `{ ok: true }` |
| `GET` | `/api/catalog` | Visible products + shop settings (hours, cut-off, coupon…) |
| `POST` | `/api/orders` | Save a website order: `{ ref: "GBD-XXXXXX", lines, deliveryDate, note, pay }` |
| `POST` | `/api/reminders` · `/api/reminders/cancel` | Reminder sign-up / cancel |

Admin (`/api/admin/*`, cookie session, permission-checked): `session`, `setup`, `login`, `logout`, `account`, `account/password`, `pulse`, `overview`, `orders` (list / detail / create / update), `products` (+ `image`), `customers`, `reminders`, `users` (+ `reset-password`), `settings`, `activity`. See `server/routes-admin.mjs`.

## Project layout

```
server/index.mjs          HTTP server: routing, same-origin check, /uploads, serves dist/
server/db.mjs             SQLite schema (migrations), seed, settings
server/auth.mjs           passwords, sessions, roles & PERMISSIONS
server/routes-public.mjs  storefront API
server/routes-admin.mjs   dashboard API
server/seed/products.json catalogue loaded into the database on first run
src/admin/                the dashboard (Shell, pages/, ui/, lib/, admin.css)
src/components/           shared storefront UI (header, cart drawer, product card…)
src/pages/<page>/         storefront pages
src/store/catalog.ts      products + settings from the API (falls back to src/data)
src/data/*.ts             built-in content (fallback catalogue, offers, FAQs, box builder…)
src/lib/checkout.ts       builds the WhatsApp order + saves a copy (swap for a payment gateway later)
src/lib/reminders.ts      reminder sign-ups
docs/                     QA-UPDATE.md (audit fixes), ADMIN-DASHBOARD.md (dashboard guide & flows)
```

**Products and shop settings are edited in the dashboard** (they live in the database). `src/data/products.ts` is only the fallback the shop shows if the server can't be reached; the box builder items, combos, panic picks and favourites tabs are still edited in `src/data/*.ts`.

## Content still to fill in

In the dashboard → **Shop settings**: `[TIME]`, `[AREA]`, `[X–Y]` delivery days, `[DAYS]`/`[HOURS]` opening hours (fields still showing a placeholder are highlighted).
In the code: `[Founder name]`, story chapter `[YEAR]`s and text, payment methods, heat/melting policy. Product photos: upload them per product in the dashboard.

See [`CLAUDE.md`](CLAUDE.md) for the build brief, [`docs/QA-UPDATE.md`](docs/QA-UPDATE.md) for the QA fixes and [`docs/ADMIN-DASHBOARD.md`](docs/ADMIN-DASHBOARD.md) for the dashboard.
