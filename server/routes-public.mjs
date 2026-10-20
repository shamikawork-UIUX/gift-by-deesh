// Public API used by the storefront.
import { db, getSettings, productOut } from './db.mjs';
import { bad, clientIp, int, isoDate, json, oneOf, rateLimiter, readJson, send, str } from './lib.mjs';

/** Keep in sync with `calendar` ids in src/data/offers.ts. */
export const OCCASIONS = ['val', 'avu', 'mom', 'dad', 'xmas'];
export const ORDER_REF = /^GBD-[A-HJ-NP-Z2-9]{6}$/;

const limited = rateLimiter(20, 60_000);
const orderLimited = rateLimiter(10, 10 * 60_000);

// ---------- reminders ----------

function cleanContact(channel, raw) {
  const v = String(raw ?? '').trim();
  if (channel === 'email') {
    const e = v.toLowerCase();
    if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw bad('That email looks a little off. Mind checking it?');
    return e;
  }
  let d = v.replace(/\D/g, '');
  if (d.startsWith('94')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (!/^7\d{8}$/.test(d)) throw bad('Please enter a Sri Lankan mobile number, e.g. 71 234 5678.');
  return `94${d}`;
}

function parseReminder(body) {
  const channel = body?.channel;
  if (channel !== 'email' && channel !== 'whatsapp') throw bad('Choose email or WhatsApp.');
  const occasions = Array.isArray(body.occasions) ? [...new Set(body.occasions)].filter((o) => OCCASIONS.includes(o)) : [];
  if (!occasions.length) throw bad('Pick at least one occasion.');
  return { channel, contact: cleanContact(channel, body.contact), occasions };
}

async function saveReminder({ req, res }, cancel) {
  if (limited(clientIp(req))) return send(res, 429, { error: 'Too many tries — please wait a minute.' });
  const { channel, contact, occasions } = parseReminder(await readJson(req));
  const existing = db.prepare('SELECT * FROM reminders WHERE channel = ? AND contact = ?').get(channel, contact);
  const current = existing ? json(existing.occasions, []) : [];
  const update = db.prepare("UPDATE reminders SET occasions = ?, consent_at = ?, updated_at = datetime('now') WHERE id = ?");

  if (cancel) {
    if (!existing) return send(res, 200, { ok: true, occasions: [] });
    const next = current.filter((o) => !occasions.includes(o));
    update.run(JSON.stringify(next), existing.consent_at, existing.id);
    return send(res, 200, { ok: true, occasions: next });
  }
  const next = [...new Set([...current, ...occasions])];
  const now = new Date().toISOString();
  if (existing) update.run(JSON.stringify(next), now, existing.id);
  else db.prepare('INSERT INTO reminders (channel, contact, occasions, consent_at) VALUES (?, ?, ?, ?)').run(channel, contact, JSON.stringify(next), now);
  return send(res, existing ? 200 : 201, { ok: true, occasions: next });
}

// ---------- orders from the website ----------

/** Validates basket lines (shared with manually created orders). */
export function parseLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) throw bad('Add at least one item.');
  if (lines.length > 50) throw bad('Too many items in one order.');
  return lines.map((l, i) => ({
    name: str(l?.name, { max: 120, required: true, label: `Item ${i + 1} name` }),
    price: int(l?.price, { min: 0, max: 10_000_000, label: `Item ${i + 1} price` }),
    qty: int(l?.qty, { min: 1, max: 99, label: `Item ${i + 1} quantity` }),
    details: Array.isArray(l?.details) ? l.details.slice(0, 20).map((d) => str(d, { max: 200, label: 'Item detail' })).filter(Boolean) : [],
  }));
}

async function createWebsiteOrder({ req, res }) {
  if (orderLimited(clientIp(req))) return send(res, 429, { error: 'Too many orders from this device — please message us on WhatsApp.' });
  const body = await readJson(req, 50_000);
  const ref = String(body.ref || '');
  if (!ORDER_REF.test(ref)) throw bad('Invalid order reference.');

  const items = parseLines(body.lines);
  const subtotal = items.reduce((a, l) => a + l.price * l.qty, 0);
  const deliveryDate = isoDate(body.deliveryDate, 'Delivery date');
  const note = str(body.note, { max: 200, label: 'Gift note' });
  const pay = oneOf(body.pay ?? 'full', ['full', 'koko'], 'Payment');

  // Same basket re-sent (customer tapped "Not yet", changed something, sent again): update it while
  // the shop hasn't picked it up yet. Once staff have confirmed it, the chat is the source of truth.
  const existing = db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref);
  if (existing) {
    const same = existing.items === JSON.stringify(items) && existing.delivery_date === deliveryDate && existing.gift_note === note && existing.pay_method === pay;
    if (existing.source === 'website' && existing.status === 'new' && !same) {
      db.prepare(`UPDATE orders SET items = ?, subtotal = ?, total = ? + delivery_fee, delivery_date = ?, gift_note = ?, pay_method = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(JSON.stringify(items), subtotal, subtotal, deliveryDate, note, pay, existing.id);
      db.prepare('INSERT INTO order_events (order_id, message) VALUES (?, ?)').run(existing.id, 'Customer changed the basket and sent it again');
    }
    return send(res, 200, { ok: true, ref });
  }

  const r = db.prepare(`INSERT INTO orders (ref, source, items, subtotal, total, delivery_date, gift_note, pay_method)
                        VALUES (?, 'website', ?, ?, ?, ?, ?, ?)`)
    .run(ref, JSON.stringify(items), subtotal, subtotal, deliveryDate, note, pay);
  db.prepare('INSERT INTO order_events (order_id, message) VALUES (?, ?)').run(r.lastInsertRowid, 'Order sent from the website to WhatsApp');
  return send(res, 201, { ok: true, ref });
}

// ---------- routes ----------

export function publicRoutes(router) {
  router.add('GET', '/api/health', ({ res }) => send(res, 200, { ok: true }));

  // Everything the storefront needs from the database in one request.
  router.add('GET', '/api/catalog', ({ res }) => {
    const products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY pop, name').all().map(productOut)
      .map(({ active, createdAt, updatedAt, ...p }) => p);
    send(res, 200, { products, settings: getSettings() }, { 'Cache-Control': 'no-cache' });
  });

  router.add('POST', '/api/reminders', (ctx) => saveReminder(ctx, false));
  router.add('POST', '/api/reminders/cancel', (ctx) => saveReminder(ctx, true));
  router.add('POST', '/api/orders', createWebsiteOrder);
}
