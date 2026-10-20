# GiftsByDeesh

Website for **GiftsByDeesh** (House of Deesh (Pvt) Ltd) — Kinder chocolate bouquets, teddy bears, Hot Wheels sets and custom gift boxes, delivered islandwide in Sri Lanka. Orders are sent to the shop on **WhatsApp** (no online payment yet).

- **Frontend:** Vite + React 18 + TypeScript, React Router, Zustand, plain CSS, `lucide-react` icons
- **API:** `server/index.mjs` — zero dependencies (Node's built-in `http` + `node:sqlite`), stores gift-reminder sign-ups

Pages: `/` Home · `/shop` Shop Gifts · `/offers` Offers · `/about` About & Contact

## Requirements

- Node.js **22.13 or newer** (built-in SQLite). Tested on Node 24.

## Run it locally

```bash
npm install          # first time only
npm run dev          # website  → http://localhost:5173
npm run api          # API      → http://localhost:8787 (Vite proxies /api to it)
```

Run `dev` and `api` in two terminals. The website works without the API, but "Remind me" on the Offers page needs it.

To use the admin list of reminder sign-ups, start the API with a token:

```bash
ADMIN_TOKEN=choose-a-long-secret npm run api      # macOS / Linux / Git Bash
$env:ADMIN_TOKEN="choose-a-long-secret"; npm run api   # PowerShell
```

## Production

```bash
npm run build        # type-check + build the site into dist/
npm start            # serves dist/ AND the API on one port (PORT, default 8787)
```

The reminders API needs a host that runs Node (e.g. Render, Railway, a VPS). A static-only host (Netlify, GitHub Pages) can serve the site but not the reminders.

| Env var | Default | Purpose |
|---|---|---|
| `PORT` | `8787` | Port for the API / production server |
| `DB_PATH` | `data/giftsbydeesh.db` | SQLite database file |
| `ADMIN_TOKEN` | *(unset)* | Enables `GET /api/reminders`. Without it the admin list is switched off |

## API

| Method | Path | Who | What |
|---|---|---|---|
| `GET` | `/api/health` | anyone | `{ ok: true }` |
| `POST` | `/api/reminders` | public | Save a sign-up: `{ channel: "whatsapp" \| "email", contact, occasions: ["val", …] }` |
| `POST` | `/api/reminders/cancel` | public | Remove occasions from a sign-up (same body) |
| `GET` | `/api/reminders` | admin | List sign-ups. Header `Authorization: Bearer $ADMIN_TOKEN` |

WhatsApp numbers are stored as `94XXXXXXXXX` (Sri Lankan mobiles only). One row per contact; signing up again merges occasions. Each row records `consent_at`. No IP address or device data is stored. Public endpoints are rate-limited (20 requests / minute / IP).

The database lives in `data/` and is **git-ignored** — it holds customer contact details, never commit it.

## Project layout

```
server/index.mjs      API + production static server
src/components/       shared UI (header, cart drawer, product card, tab bar …)
src/pages/<page>/     one folder per page and its sections
src/data/*.ts         products, prices, offers, FAQs, site details — edit content here
src/lib/checkout.ts   builds the WhatsApp order (swap for a payment gateway later)
src/lib/reminders.ts  reminder sign-ups (swap for Mailchimp / Brevo later)
src/store/            Zustand stores (cart is saved in localStorage)
reference/            original interactive prototypes (visual spec)
docs/QA-UPDATE.md     QA audit findings and the fixes made
```

## Content still to fill in

These placeholders are intentionally visible as `[…]` until the client supplies them: `[TIME]` and `[AREA]` (delivery cut-off, `src/data/site.ts`), `[DAYS]`, `[HOURS]` (opening hours), `[Founder name]`, story chapter `[YEAR]`s and text, the FAQ delivery days, payment methods, heat/melting policy, and all product photos (`public/images/`).

See [`CLAUDE.md`](CLAUDE.md) for the full build brief and [`docs/QA-UPDATE.md`](docs/QA-UPDATE.md) for the latest QA changes.
