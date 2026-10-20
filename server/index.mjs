// GiftsByDeesh API — zero dependencies (Node 22.13+ built-in http + sqlite).
//
//   POST /api/reminders          save a reminder sign-up (public)
//   POST /api/reminders/cancel   remove occasions from a sign-up (public)
//   GET  /api/reminders          list sign-ups (admin: Authorization: Bearer $ADMIN_TOKEN)
//   GET  /api/health
//
// In production it also serves the built site from dist/ (run `npm run build` first).
// Env: PORT (default 8787), DB_PATH (default data/giftsbydeesh.db), ADMIN_TOKEN (admin list is off without it).

import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8787;
const DB_PATH = process.env.DB_PATH || join(root, 'data', 'giftsbydeesh.db');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const DIST = join(root, 'dist');

/** Keep in sync with `calendar` ids in src/data/offers.ts. */
const OCCASIONS = ['val', 'avu', 'mom', 'dad', 'xmas'];

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS reminders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    channel     TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    contact     TEXT NOT NULL,              -- lower-cased email, or WhatsApp number as 94XXXXXXXXX
    occasions   TEXT NOT NULL DEFAULT '[]', -- JSON array of occasion ids
    consent_at  TEXT NOT NULL,              -- when they agreed to be contacted
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (channel, contact)
  );
`);

const findOne = db.prepare('SELECT * FROM reminders WHERE channel = ? AND contact = ?');
const insert = db.prepare('INSERT INTO reminders (channel, contact, occasions, consent_at) VALUES (?, ?, ?, ?)');
const update = db.prepare("UPDATE reminders SET occasions = ?, consent_at = ?, updated_at = datetime('now') WHERE id = ?");
const listAll = db.prepare('SELECT * FROM reminders ORDER BY created_at DESC');

// ---------- validation ----------

class BadRequest extends Error {}

function cleanContact(channel, raw) {
  const v = String(raw ?? '').trim();
  if (channel === 'email') {
    const e = v.toLowerCase();
    if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new BadRequest('That email looks a little off. Mind checking it?');
    return e;
  }
  // Sri Lankan mobile: accept "071 234 5678", "71 234 5678", "+94 71 234 5678" → 9471XXXXXXX
  let d = v.replace(/\D/g, '');
  if (d.startsWith('94')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (!/^7\d{8}$/.test(d)) throw new BadRequest('Please enter a Sri Lankan mobile number, e.g. 71 234 5678.');
  return `94${d}`;
}

function parseBody(body) {
  const channel = body?.channel;
  if (channel !== 'email' && channel !== 'whatsapp') throw new BadRequest('Choose email or WhatsApp.');
  const occasions = Array.isArray(body.occasions) ? [...new Set(body.occasions)].filter((o) => OCCASIONS.includes(o)) : [];
  if (!occasions.length) throw new BadRequest('Pick at least one occasion.');
  return { channel, contact: cleanContact(channel, body.contact), occasions };
}

// ---------- tiny per-IP rate limit (public endpoints) ----------

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

// ---------- http helpers ----------

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 10_000) { fail(new BadRequest('Request too large.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { ok(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { fail(new BadRequest('Invalid JSON.')); }
    });
    req.on('error', fail);
  });
}

const rowOut = (r) => ({ ...r, occasions: JSON.parse(r.occasions) });

// ---------- routes ----------

async function api(req, res, path) {
  if (path === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true });

  if (path === '/api/reminders' && req.method === 'GET') {
    if (!ADMIN_TOKEN) return send(res, 503, { error: 'Admin access is not configured (set ADMIN_TOKEN).' });
    if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) return send(res, 401, { error: 'Unauthorised.' });
    return send(res, 200, { reminders: listAll.all().map(rowOut) });
  }

  if ((path === '/api/reminders' || path === '/api/reminders/cancel') && req.method === 'POST') {
    if (limited(req.socket.remoteAddress || '?')) return send(res, 429, { error: 'Too many tries — please wait a minute.' });
    const { channel, contact, occasions } = parseBody(await readJson(req));
    const existing = findOne.get(channel, contact);
    const current = existing ? JSON.parse(existing.occasions) : [];

    if (path === '/api/reminders/cancel') {
      if (!existing) return send(res, 200, { ok: true, occasions: [] });
      const next = current.filter((o) => !occasions.includes(o));
      update.run(JSON.stringify(next), existing.consent_at, existing.id);
      return send(res, 200, { ok: true, occasions: next });
    }

    const next = [...new Set([...current, ...occasions])];
    const now = new Date().toISOString();
    if (existing) update.run(JSON.stringify(next), now, existing.id);
    else insert.run(channel, contact, JSON.stringify(next), now);
    return send(res, existing ? 200 : 201, { ok: true, occasions: next });
  }

  return send(res, 404, { error: 'Not found.' });
}

// ---------- static site (production) ----------

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.ico': 'image/x-icon',
};

function serveStatic(res, path) {
  if (!existsSync(DIST)) return send(res, 404, { error: 'Site not built. Run `npm run build`, or use `npm run dev` for development.' });
  let file = normalize(join(DIST, decodeURIComponent(path)));
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'Forbidden.' });
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html'); // SPA fallback
  const ext = extname(file);
  res.writeHead(200, {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': file.includes(`${join(DIST, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  res.end(readFileSync(file));
}

createServer(async (req, res) => {
  const path = new URL(req.url || '/', 'http://x').pathname;
  try {
    if (path.startsWith('/api/')) await api(req, res, path);
    else serveStatic(res, path);
  } catch (e) {
    if (e instanceof BadRequest) send(res, 400, { error: e.message });
    else { console.error(e); send(res, 500, { error: 'Something went wrong on our side.' }); }
  }
}).listen(PORT, () => console.log(`GiftsByDeesh API on http://localhost:${PORT}  (db: ${DB_PATH})`));
