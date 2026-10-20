// SQLite database: schema migrations, seed data and settings.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = process.env.DATA_DIR || join(ROOT, 'data');
export const UPLOAD_DIR = join(DATA_DIR, 'uploads');
const DB_PATH = process.env.DB_PATH || join(DATA_DIR, 'giftsbydeesh.db');

mkdirSync(dirname(DB_PATH), { recursive: true });
mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
export const dbPath = DB_PATH;

// Each entry upgrades the schema by one version (PRAGMA user_version). Never edit a shipped migration — add a new one.
const migrations = [
  // v1 — reminder sign-ups
  `CREATE TABLE IF NOT EXISTS reminders (
     id          INTEGER PRIMARY KEY AUTOINCREMENT,
     channel     TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
     contact     TEXT NOT NULL,
     occasions   TEXT NOT NULL DEFAULT '[]',
     consent_at  TEXT NOT NULL,
     created_at  TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
     UNIQUE (channel, contact)
   );`,
  // v2 — admin: users, sessions, products, orders, settings, audit log
  `CREATE TABLE users (
     id                   INTEGER PRIMARY KEY AUTOINCREMENT,
     name                 TEXT NOT NULL,
     email                TEXT NOT NULL UNIQUE COLLATE NOCASE,
     role                 TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
     password_hash        TEXT NOT NULL,
     must_change_password INTEGER NOT NULL DEFAULT 0,
     active               INTEGER NOT NULL DEFAULT 1,
     created_at           TEXT NOT NULL DEFAULT (datetime('now')),
     last_login_at        TEXT
   );
   CREATE TABLE sessions (
     token_hash   TEXT PRIMARY KEY,
     user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at   TEXT NOT NULL DEFAULT (datetime('now')),
     expires_at   TEXT NOT NULL
   );
   CREATE TABLE products (
     id          TEXT PRIMARY KEY,
     name        TEXT NOT NULL,
     note        TEXT NOT NULL DEFAULT '',
     price       INTEGER NOT NULL,
     who         TEXT NOT NULL DEFAULT '[]',
     occ         TEXT NOT NULL DEFAULT '[]',
     vibe        TEXT NOT NULL,
     tint        TEXT NOT NULL DEFAULT '#F7D3DE',
     tint2       TEXT NOT NULL DEFAULT '#F2C0D0',
     paper       TEXT NOT NULL DEFAULT '#E9A3BA',
     badge       TEXT,
     pop         INTEGER NOT NULL DEFAULT 100,
     image       TEXT,
     active      INTEGER NOT NULL DEFAULT 1,
     created_at  TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE orders (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     ref             TEXT NOT NULL UNIQUE,
     source          TEXT NOT NULL CHECK (source IN ('website', 'manual')),
     status          TEXT NOT NULL DEFAULT 'new',
     payment_status  TEXT NOT NULL DEFAULT 'unpaid',
     pay_method      TEXT NOT NULL DEFAULT 'full',
     items           TEXT NOT NULL DEFAULT '[]',
     subtotal        INTEGER NOT NULL DEFAULT 0,
     delivery_fee    INTEGER NOT NULL DEFAULT 0,
     total           INTEGER NOT NULL DEFAULT 0,
     delivery_date   TEXT,
     gift_note       TEXT NOT NULL DEFAULT '',
     customer_name   TEXT NOT NULL DEFAULT '',
     customer_phone  TEXT,
     address         TEXT NOT NULL DEFAULT '',
     staff_notes     TEXT NOT NULL DEFAULT '',
     created_by      INTEGER REFERENCES users(id),
     created_at      TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE INDEX orders_status ON orders(status, created_at);
   CREATE INDEX orders_phone ON orders(customer_phone);
   CREATE TABLE order_events (
     id        INTEGER PRIMARY KEY AUTOINCREMENT,
     order_id  INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     at        TEXT NOT NULL DEFAULT (datetime('now')),
     user_id   INTEGER REFERENCES users(id),
     message   TEXT NOT NULL
   );
   CREATE TABLE settings (
     key    TEXT PRIMARY KEY,
     value  TEXT NOT NULL
   );
   CREATE TABLE audit_log (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     at         TEXT NOT NULL DEFAULT (datetime('now')),
     user_id    INTEGER REFERENCES users(id),
     action     TEXT NOT NULL,
     entity     TEXT NOT NULL,
     entity_id  TEXT,
     summary    TEXT NOT NULL
   );
   CREATE INDEX audit_at ON audit_log(at);`,
];

let version = db.prepare('PRAGMA user_version').get().user_version;
for (; version < migrations.length; version++) {
  db.exec('BEGIN');
  try {
    db.exec(migrations[version]);
    db.exec(`PRAGMA user_version = ${version + 1}`);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// ---------- seed: the catalogue that shipped with the site ----------

if (db.prepare('SELECT COUNT(*) n FROM products').get().n === 0) {
  const seed = JSON.parse(readFileSync(join(ROOT, 'server', 'seed', 'products.json'), 'utf8'));
  const ins = db.prepare(`INSERT INTO products (id, name, note, price, who, occ, vibe, tint, tint2, paper, badge, pop, image)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const p of seed) {
    ins.run(p.id, p.name, p.note, p.price, JSON.stringify(p.who), JSON.stringify(p.occ), p.vibe, p.tint, p.tint2, p.paper, p.badge ?? null, p.pop, p.image ?? null);
  }
}

// ---------- settings ----------

/** Every setting the storefront reads, with its default. `[…]` values are placeholders for the client to fill in. */
export const SETTINGS_DEFAULTS = {
  shopHours: 'Open [DAYS], [HOURS]',
  cutoffTime: '[TIME]',
  cutoffArea: '[AREA]',
  deliveryDays: '[X–Y]',
  orderWhatsApp: '94721770653',
  weeklyOfferTitle: 'Bouquet Week · 15% off all bouquets',
  weeklyOfferBadge: '15%',
  offerEnd: '2026-10-31T23:59',
  couponCode: 'SWEET10',
  couponLabel: '10% off your first order',
  couponShort: '10%',
};

export function getSettings() {
  const out = { ...SETTINGS_DEFAULTS };
  for (const r of db.prepare('SELECT key, value FROM settings').all()) if (r.key in out) out[r.key] = JSON.parse(r.value);
  return out;
}

export function saveSettings(patch) {
  const up = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const [k, v] of Object.entries(patch)) if (k in SETTINGS_DEFAULTS) up.run(k, JSON.stringify(v));
}

export function audit(userId, action, entity, entityId, summary) {
  db.prepare('INSERT INTO audit_log (user_id, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?)')
    .run(userId ?? null, action, entity, entityId == null ? null : String(entityId), summary);
}

export const productOut = (r) => ({
  id: r.id, name: r.name, note: r.note, price: r.price, who: JSON.parse(r.who), occ: JSON.parse(r.occ), vibe: r.vibe,
  tint: r.tint, tint2: r.tint2, paper: r.paper, badge: r.badge || undefined, pop: r.pop, image: r.image || undefined,
  active: !!r.active, createdAt: r.created_at, updatedAt: r.updated_at,
});
