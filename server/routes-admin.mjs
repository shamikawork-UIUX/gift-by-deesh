// Admin API (/api/admin/*). Every route checks the signed-in user's permissions.
import { randomBytes } from 'node:crypto';
import { unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { audit, db, getSettings, productOut, saveSettings, SETTINGS_DEFAULTS, UPLOAD_DIR } from './db.mjs';
import {
  checkNewPassword, createSession, currentUser, destroySession, endAllSessions, hashPassword, requireUser, ROLES, tempPassword,
  userOut, verifyPassword, can,
} from './auth.mjs';
import { bad, clientIp, failureCounter, HttpError, int, isoDate, json, lkMobile, oneOf, readJson, send, str } from './lib.mjs';
import { OCCASIONS, parseLines } from './routes-public.mjs';

export const STATUSES = ['new', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const ACTIVE = ['new', 'confirmed', 'preparing', 'out_for_delivery'];
const SOLD = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_LABEL = { new: 'New', confirmed: 'Confirmed', preparing: 'Preparing', out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
const WHO = ['her', 'him', 'kids', 'friend'];
const OCC = ['birthday', 'anniversary', 'just'];
const VIBES = ['sweet', 'cuddly', 'playful', 'fancy'];

// 8 wrong passwords per 15 minutes per IP address, and per account.
const loginFails = failureCounter(8, 15 * 60_000);
const iso = (sqlTime) => (sqlTime ? `${sqlTime.replace(' ', 'T')}Z` : null);
const todayLK = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());
const money = (n) => `LKR ${Number(n).toLocaleString('en-US')}`;

function newRef() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    const ref = 'GBD-' + [...randomBytes(6)].map((b) => abc[b % abc.length]).join('');
    if (!db.prepare('SELECT 1 FROM orders WHERE ref = ?').get(ref)) return ref;
  }
}

const orderOut = (o) => ({
  ref: o.ref, source: o.source, status: o.status, paymentStatus: o.payment_status, payMethod: o.pay_method,
  items: json(o.items, []), subtotal: o.subtotal, deliveryFee: o.delivery_fee, total: o.total, deliveryDate: o.delivery_date,
  giftNote: o.gift_note, customerName: o.customer_name, customerPhone: o.customer_phone, address: o.address,
  staffNotes: o.staff_notes, createdAt: iso(o.created_at), updatedAt: iso(o.updated_at),
});

function getOrder(ref) {
  const o = db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref);
  if (!o) throw new HttpError(404, 'Order not found. It may have been mistyped.');
  return o;
}

const event = (orderId, userId, message) => db.prepare('INSERT INTO order_events (order_id, user_id, message) VALUES (?, ?, ?)').run(orderId, userId, message);

// ======================================================================
// Auth & account
// ======================================================================

function authRoutes(r) {
  r.add('GET', '/api/admin/session', ({ req, res }) => {
    const needsSetup = db.prepare('SELECT COUNT(*) n FROM users').get().n === 0;
    send(res, 200, { user: currentUser(req), needsSetup, setupNeedsCode: !!process.env.SETUP_CODE || process.env.NODE_ENV === 'production' });
  });

  // First run only: create the owner account.
  r.add('POST', '/api/admin/setup', async ({ req, res }) => {
    if (db.prepare('SELECT COUNT(*) n FROM users').get().n > 0) throw new HttpError(409, 'The owner account already exists. Please sign in.');
    const b = await readJson(req);
    // Behind a proxy every request looks local, so production always needs a setup code.
    if (process.env.SETUP_CODE) {
      if (b.setupCode !== process.env.SETUP_CODE) throw new HttpError(403, "That setup code isn't right.");
    } else if (process.env.NODE_ENV === 'production' || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) {
      throw new HttpError(403, 'Set SETUP_CODE on the server to create the owner account.');
    }
    const name = str(b.name, { max: 80, required: true, label: 'Your name' });
    const email = str(b.email, { max: 254, required: true, label: 'Email' }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('That email looks a little off.');
    checkNewPassword(b.password);
    const u = db.prepare('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)').run(name, email, 'owner', hashPassword(b.password));
    audit(u.lastInsertRowid, 'create', 'user', u.lastInsertRowid, `${name} set up the dashboard as owner`);
    createSession(res, u.lastInsertRowid);
    send(res, 201, { user: userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(u.lastInsertRowid)) });
  });

  r.add('POST', '/api/admin/login', async ({ req, res }) => {
    const b = await readJson(req);
    const email = String(b.email || '').trim().toLowerCase();
    const ip = clientIp(req);
    if (loginFails.blocked(ip) || loginFails.blocked(`acct:${email}`)) throw new HttpError(429, 'Too many wrong passwords. Please wait 15 minutes and try again, or ask the owner to reset your password.');
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Same message for unknown email and wrong password, so accounts can't be discovered.
    if (!u || !verifyPassword(String(b.password || ''), u.password_hash)) {
      loginFails.fail(ip);
      loginFails.fail(`acct:${email}`);
      throw new HttpError(401, "That email and password don't match. Check them and try again.");
    }
    loginFails.clear(ip);
    loginFails.clear(`acct:${email}`);
    if (!u.active) throw new HttpError(403, 'This account has been switched off. Ask the shop owner to turn it back on.');
    db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(u.id);
    createSession(res, u.id);
    send(res, 200, { user: userOut(u) });
  });

  r.add('POST', '/api/admin/logout', ({ req, res }) => {
    destroySession(req, res);
    send(res, 200, { ok: true });
  });

  r.add('POST', '/api/admin/account/password', async ({ req, res }) => {
    const me = requireUser(req, '__self');
    const b = await readJson(req);
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(me.id);
    if (!verifyPassword(String(b.current || ''), row.password_hash)) throw bad('Your current password is not right.');
    checkNewPassword(b.next);
    if (b.next === b.current) throw bad('Choose a password different from the current one.');
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hashPassword(b.next), me.id);
    endAllSessions(me.id); // signs out other devices
    createSession(res, me.id);
    audit(me.id, 'update', 'user', me.id, `${me.name} changed their password`);
    send(res, 200, { user: userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(me.id)) });
  });

  r.add('PATCH', '/api/admin/account', async ({ req, res }) => {
    const me = requireUser(req);
    const b = await readJson(req);
    const name = str(b.name, { max: 80, required: true, label: 'Name' });
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, me.id);
    send(res, 200, { user: userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(me.id)) });
  });
}

// ======================================================================
// Overview
// ======================================================================

function overviewRoutes(r) {
  // Polled by the dashboard every 30 s for the "new orders" badge.
  r.add('GET', '/api/admin/pulse', ({ req, res }) => {
    requireUser(req, 'orders.view');
    send(res, 200, { newOrders: db.prepare("SELECT COUNT(*) n FROM orders WHERE status = 'new'").get().n });
  });

  r.add('GET', '/api/admin/overview', ({ req, res }) => {
    const me = requireUser(req, 'orders.view');
    const today = todayLK();
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const row of db.prepare('SELECT status, COUNT(*) n FROM orders GROUP BY status').all()) counts[row.status] = row.n;

    const q = (sql, ...a) => db.prepare(sql).all(...a).map(orderOut);
    const awaiting = q("SELECT * FROM orders WHERE status = 'new' ORDER BY created_at LIMIT 6");
    const dueToday = q(`SELECT * FROM orders WHERE delivery_date = ? AND status IN (${ACTIVE.map(() => '?').join(',')}) ORDER BY status`, today, ...ACTIVE);
    const overdue = db.prepare(`SELECT COUNT(*) n FROM orders WHERE delivery_date < ? AND status IN (${ACTIVE.map(() => '?').join(',')})`).get(today, ...ACTIVE).n;

    let revenue = null;
    if (can(me, 'revenue.view')) {
      const sum = (since) => db.prepare(`SELECT COALESCE(SUM(total),0) s, COUNT(*) n FROM orders WHERE status IN (${SOLD.map(() => '?').join(',')}) AND created_at >= ?`).get(...SOLD, since);
      revenue = { last7: sum(new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 19).replace('T', ' ')), month: sum(`${today.slice(0, 7)}-01 00:00:00`) };
    }
    const reminders = db.prepare('SELECT occasions FROM reminders').all().flatMap((x) => json(x.occasions, []));
    const reminderCounts = Object.fromEntries(OCCASIONS.map((o) => [o, reminders.filter((x) => x === o).length]));
    send(res, 200, { today, counts, awaiting, dueToday, overdue, revenue, reminderCounts });
  });
}

// ======================================================================
// Orders
// ======================================================================

function orderRoutes(r) {
  r.add('GET', '/api/admin/orders', ({ req, res, url }) => {
    requireUser(req, 'orders.view');
    const status = url.searchParams.get('status') || 'active';
    const qText = (url.searchParams.get('q') || '').trim().toLowerCase();
    const phone = url.searchParams.get('phone');
    const where = [];
    const args = [];
    if (status === 'active') { where.push(`status IN (${ACTIVE.map(() => '?').join(',')})`); args.push(...ACTIVE); }
    else if (STATUSES.includes(status)) { where.push('status = ?'); args.push(status); }
    if (phone) { where.push('customer_phone = ?'); args.push(phone); }
    if (qText) {
      where.push('(LOWER(ref) LIKE ? OR LOWER(customer_name) LIKE ? OR customer_phone LIKE ? OR LOWER(items) LIKE ?)');
      const like = `%${qText}%`;
      args.push(like, like, `%${qText.replace(/\D/g, '') || qText}%`, like);
    }
    // Active orders: soonest delivery first. Everything else: newest first.
    const order = status === 'active' ? "CASE status WHEN 'new' THEN 0 ELSE 1 END, COALESCE(delivery_date, '9999'), created_at" : 'created_at DESC';
    const rows = db.prepare(`SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT 300`).all(...args);

    const counts = { active: 0, all: 0 };
    for (const s of STATUSES) counts[s] = 0;
    for (const row of db.prepare('SELECT status, COUNT(*) n FROM orders GROUP BY status').all()) {
      counts[row.status] = row.n;
      counts.all += row.n;
      if (ACTIVE.includes(row.status)) counts.active += row.n;
    }
    send(res, 200, { orders: rows.map(orderOut), counts });
  });

  r.add('GET', '/api/admin/orders/:ref', ({ req, res, params }) => {
    requireUser(req, 'orders.view');
    const o = getOrder(params.ref);
    const events = db.prepare('SELECT e.at, e.message, u.name user FROM order_events e LEFT JOIN users u ON u.id = e.user_id WHERE order_id = ? ORDER BY e.id DESC').all(o.id)
      .map((e) => ({ at: iso(e.at), message: e.message, user: e.user }));
    send(res, 200, { order: orderOut(o), events });
  });

  // Orders that came in by phone, Instagram DM or a WhatsApp chat directly.
  r.add('POST', '/api/admin/orders', async ({ req, res }) => {
    const me = requireUser(req, 'orders.edit');
    const b = await readJson(req, 50_000);
    const items = parseLines(b.items);
    const subtotal = items.reduce((a, l) => a + l.price * l.qty, 0);
    const fee = int(b.deliveryFee ?? 0, { min: 0, max: 100_000, label: 'Delivery fee' });
    const ref = newRef();
    const status = oneOf(b.status ?? 'confirmed', ['new', 'confirmed'], 'Status');
    const res1 = db.prepare(`INSERT INTO orders (ref, source, status, payment_status, pay_method, items, subtotal, delivery_fee, total, delivery_date,
                             gift_note, customer_name, customer_phone, address, staff_notes, created_by)
                             VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      ref, status, oneOf(b.paymentStatus ?? 'unpaid', ['unpaid', 'paid'], 'Payment status'), oneOf(b.payMethod ?? 'full', ['full', 'koko'], 'Payment method'),
      JSON.stringify(items), subtotal, fee, subtotal + fee, isoDate(b.deliveryDate, 'Delivery date'),
      str(b.giftNote, { max: 200, label: 'Gift note' }), str(b.customerName, { max: 80, required: true, label: 'Customer name' }),
      lkMobile(b.customerPhone, { required: true }), str(b.address, { max: 400, label: 'Address' }), str(b.staffNotes, { max: 1000, label: 'Notes' }), me.id,
    );
    event(res1.lastInsertRowid, me.id, `Order added by ${me.name}`);
    audit(me.id, 'create', 'order', ref, `Added order ${ref} for ${b.customerName} (${money(subtotal + fee)})`);
    send(res, 201, { order: orderOut(getOrder(ref)) });
  });

  r.add('PATCH', '/api/admin/orders/:ref', async ({ req, res, params }) => {
    const me = requireUser(req, 'orders.edit');
    const o = getOrder(params.ref);
    const b = await readJson(req, 50_000);
    const set = {};
    const notes = [];

    if (b.status !== undefined && b.status !== o.status) {
      oneOf(b.status, STATUSES, 'Status');
      if ((b.status === 'cancelled' || o.status === 'cancelled') && !can(me, 'orders.cancel')) {
        throw new HttpError(403, 'Only a manager or the owner can cancel or reopen orders.');
      }
      set.status = b.status;
      const reason = str(b.reason, { max: 300, label: 'Reason' });
      notes.push(`Status: ${STATUS_LABEL[o.status]} → ${STATUS_LABEL[b.status]}${reason ? ` (${reason})` : ''}`);
    }
    if (b.paymentStatus !== undefined && b.paymentStatus !== o.payment_status) {
      set.payment_status = oneOf(b.paymentStatus, ['unpaid', 'paid'], 'Payment status');
      notes.push(b.paymentStatus === 'paid' ? 'Marked as paid' : 'Marked as unpaid');
    }
    if (b.payMethod !== undefined && b.payMethod !== o.pay_method) {
      set.pay_method = oneOf(b.payMethod, ['full', 'koko'], 'Payment method');
      notes.push(`Payment method: ${b.payMethod === 'koko' ? 'KOKO' : 'Pay in full'}`);
    }
    const fields = [
      ['customerName', 'customer_name', (v) => str(v, { max: 80, label: 'Customer name' }), 'customer name'],
      ['customerPhone', 'customer_phone', (v) => lkMobile(v), 'phone number'],
      ['address', 'address', (v) => str(v, { max: 400, label: 'Address' }), 'delivery address'],
      ['deliveryDate', 'delivery_date', (v) => isoDate(v, 'Delivery date'), 'delivery date'],
      ['giftNote', 'gift_note', (v) => str(v, { max: 200, label: 'Gift note' }), 'gift note'],
      ['staffNotes', 'staff_notes', (v) => str(v, { max: 1000, label: 'Notes' }), 'internal notes'],
    ];
    const changed = [];
    for (const [k, col, clean, label] of fields) {
      if (b[k] === undefined) continue;
      const v = clean(b[k]);
      if ((v ?? null) !== (o[col] ?? null)) { set[col] = v; changed.push(label); }
    }
    if (b.items !== undefined || b.deliveryFee !== undefined) {
      const items = b.items !== undefined ? parseLines(b.items) : json(o.items, []);
      const fee = b.deliveryFee !== undefined ? int(b.deliveryFee, { min: 0, max: 100_000, label: 'Delivery fee' }) : o.delivery_fee;
      const subtotal = items.reduce((a, l) => a + l.price * l.qty, 0);
      if (JSON.stringify(items) !== o.items) { set.items = JSON.stringify(items); changed.push('items'); }
      if (fee !== o.delivery_fee) changed.push('delivery fee');
      set.delivery_fee = fee;
      set.subtotal = subtotal;
      set.total = subtotal + fee;
    }
    if (changed.length) notes.push(`Updated ${changed.join(', ')}`);
    if (!notes.length) return send(res, 200, { order: orderOut(o) });

    const cols = Object.keys(set);
    db.prepare(`UPDATE orders SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...cols.map((c) => set[c]), o.id);
    for (const n of notes) event(o.id, me.id, n);
    audit(me.id, 'update', 'order', o.ref, `${o.ref}: ${notes.join('; ')}`);
    send(res, 200, { order: orderOut(getOrder(o.ref)) });
  });
}

// ======================================================================
// Products
// ======================================================================

const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 48) || 'product';
const hex = (v, label) => { const s = String(v || ''); if (!/^#[0-9a-f]{6}$/i.test(s)) throw bad(`${label} must be a colour like #F7D3DE.`); return s.toUpperCase(); };
const listOf = (v, allowed, label) => {
  const a = Array.isArray(v) ? [...new Set(v)].filter((x) => allowed.includes(x)) : [];
  if (!a.length) throw bad(`Choose at least one option for “${label}”.`);
  return a;
};

function parseProduct(b, existing) {
  const pick = (k, fallback) => (b[k] !== undefined ? b[k] : fallback);
  return {
    name: str(pick('name', existing?.name), { max: 80, required: true, label: 'Product name' }),
    note: str(pick('note', existing?.note), { max: 80, label: 'Short description' }),
    price: int(pick('price', existing?.price), { min: 0, max: 10_000_000, label: 'Price' }),
    who: listOf(pick('who', existing && json(existing.who, [])), WHO, 'Who is it for'),
    occ: listOf(pick('occ', existing && json(existing.occ, [])), OCC, 'Occasions'),
    vibe: oneOf(pick('vibe', existing?.vibe), VIBES, 'Vibe'),
    tint: hex(pick('tint', existing?.tint ?? '#F7D3DE'), 'Photo background'),
    tint2: hex(pick('tint2', existing?.tint2 ?? pick('tint', '#F2C0D0')), 'Second background'),
    paper: hex(pick('paper', existing?.paper ?? '#E9A3BA'), 'Wrapping colour'),
    badge: (() => { const v = pick('badge', existing?.badge ?? null); return v ? oneOf(v, ['Bestseller', 'New'], 'Badge') : null; })(),
    pop: int(pick('pop', existing?.pop ?? 100), { min: 1, max: 9999, label: 'Sort position' }),
    active: pick('active', existing ? !!existing.active : true) ? 1 : 0,
  };
}

function productRoutes(r) {
  r.add('GET', '/api/admin/products', ({ req, res }) => {
    requireUser(req, 'products.view');
    send(res, 200, { products: db.prepare('SELECT * FROM products ORDER BY active DESC, pop, name').all().map(productOut) });
  });

  r.add('GET', '/api/admin/products/:id', ({ req, res, params }) => {
    requireUser(req, 'products.view');
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    if (!p) throw new HttpError(404, 'Product not found.');
    send(res, 200, { product: productOut(p) });
  });

  r.add('POST', '/api/admin/products', async ({ req, res }) => {
    const me = requireUser(req, 'products.edit');
    const p = parseProduct(await readJson(req));
    let id = slug(p.name);
    for (let i = 2; db.prepare('SELECT 1 FROM products WHERE id = ?').get(id); i++) id = `${slug(p.name)}-${i}`;
    db.prepare(`INSERT INTO products (id, name, note, price, who, occ, vibe, tint, tint2, paper, badge, pop, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, p.name, p.note, p.price, JSON.stringify(p.who), JSON.stringify(p.occ), p.vibe, p.tint, p.tint2, p.paper, p.badge, p.pop, p.active);
    audit(me.id, 'create', 'product', id, `Added product “${p.name}” at ${money(p.price)}${p.active ? '' : ' (hidden)'}`);
    send(res, 201, { product: productOut(db.prepare('SELECT * FROM products WHERE id = ?').get(id)) });
  });

  r.add('PATCH', '/api/admin/products/:id', async ({ req, res, params }) => {
    const me = requireUser(req, 'products.edit');
    const ex = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    if (!ex) throw new HttpError(404, 'Product not found.');
    const p = parseProduct(await readJson(req), ex);
    db.prepare(`UPDATE products SET name=?, note=?, price=?, who=?, occ=?, vibe=?, tint=?, tint2=?, paper=?, badge=?, pop=?, active=?, updated_at=datetime('now') WHERE id=?`)
      .run(p.name, p.note, p.price, JSON.stringify(p.who), JSON.stringify(p.occ), p.vibe, p.tint, p.tint2, p.paper, p.badge, p.pop, p.active, ex.id);
    const what = [];
    if (p.price !== ex.price) what.push(`price ${money(ex.price)} → ${money(p.price)}`);
    if (p.active !== ex.active) what.push(p.active ? 'shown on website' : 'hidden from website');
    if (p.name !== ex.name) what.push(`renamed from “${ex.name}”`);
    audit(me.id, 'update', 'product', ex.id, `Edited “${p.name}”${what.length ? `: ${what.join(', ')}` : ''}`);
    send(res, 200, { product: productOut(db.prepare('SELECT * FROM products WHERE id = ?').get(ex.id)) });
  });

  r.add('DELETE', '/api/admin/products/:id', ({ req, res, params }) => {
    const me = requireUser(req, 'products.edit');
    const ex = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    if (!ex) throw new HttpError(404, 'Product not found.');
    db.prepare('DELETE FROM products WHERE id = ?').run(ex.id);
    removeImageFile(ex.image);
    audit(me.id, 'delete', 'product', ex.id, `Deleted product “${ex.name}”`);
    send(res, 200, { ok: true });
  });

  // Photo upload: the dashboard resizes the image and sends it as a data URL.
  r.add('POST', '/api/admin/products/:id/image', async ({ req, res, params }) => {
    const me = requireUser(req, 'products.edit');
    const ex = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    if (!ex) throw new HttpError(404, 'Product not found.');
    const { dataUrl } = await readJson(req, 6_000_000);
    const m = /^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
    if (!m) throw bad('Please upload a JPG, PNG or WebP image.');
    const buf = Buffer.from(m[2], 'base64');
    const magic = { webp: buf.subarray(8, 12).toString() === 'WEBP', jpeg: buf[0] === 0xff && buf[1] === 0xd8, png: buf.subarray(1, 4).toString() === 'PNG' };
    if (!magic[m[1]]) throw bad("That file doesn't look like a real image.");
    if (buf.length > 4_000_000) throw bad('That image is too large (max 4 MB).');
    const file = `${ex.id}-${Date.now().toString(36)}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
    writeFileSync(join(UPLOAD_DIR, file), buf);
    removeImageFile(ex.image);
    db.prepare("UPDATE products SET image = ?, updated_at = datetime('now') WHERE id = ?").run(`/uploads/${file}`, ex.id);
    audit(me.id, 'update', 'product', ex.id, `New photo for “${ex.name}”`);
    send(res, 200, { product: productOut(db.prepare('SELECT * FROM products WHERE id = ?').get(ex.id)) });
  });

  r.add('DELETE', '/api/admin/products/:id/image', ({ req, res, params }) => {
    const me = requireUser(req, 'products.edit');
    const ex = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    if (!ex) throw new HttpError(404, 'Product not found.');
    removeImageFile(ex.image);
    db.prepare("UPDATE products SET image = NULL, updated_at = datetime('now') WHERE id = ?").run(ex.id);
    audit(me.id, 'update', 'product', ex.id, `Removed photo from “${ex.name}”`);
    send(res, 200, { product: productOut(db.prepare('SELECT * FROM products WHERE id = ?').get(ex.id)) });
  });
}

function removeImageFile(path) {
  if (!path || !path.startsWith('/uploads/')) return;
  try { unlinkSync(join(UPLOAD_DIR, path.slice('/uploads/'.length))); } catch { /* already gone */ }
}

// ======================================================================
// Customers, reminders, team, settings, activity
// ======================================================================

function peopleRoutes(r) {
  r.add('GET', '/api/admin/customers', ({ req, res }) => {
    requireUser(req, 'customers.view');
    const rows = db.prepare(`
      SELECT customer_phone phone,
             (SELECT customer_name FROM orders o2 WHERE o2.customer_phone = o.customer_phone AND customer_name <> '' ORDER BY created_at DESC LIMIT 1) name,
             COUNT(*) orders,
             SUM(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END) spent,
             MAX(created_at) last_order
      FROM orders o WHERE customer_phone IS NOT NULL GROUP BY customer_phone ORDER BY last_order DESC`).all();
    const wa = new Set(db.prepare("SELECT contact FROM reminders WHERE channel = 'whatsapp'").all().map((x) => x.contact));
    send(res, 200, { customers: rows.map((c) => ({ ...c, name: c.name || '', lastOrder: iso(c.last_order), last_order: undefined, reminders: wa.has(c.phone) })) });
  });

  r.add('GET', '/api/admin/reminders', ({ req, res }) => {
    requireUser(req, 'reminders.view');
    send(res, 200, { reminders: db.prepare('SELECT * FROM reminders ORDER BY created_at DESC').all().map((x) => ({
      id: x.id, channel: x.channel, contact: x.contact, occasions: json(x.occasions, []), consentAt: x.consent_at, createdAt: iso(x.created_at),
    })) });
  });

  r.add('DELETE', '/api/admin/reminders/:id', ({ req, res, params }) => {
    const me = requireUser(req, 'reminders.manage');
    const x = db.prepare('SELECT * FROM reminders WHERE id = ?').get(Number(params.id));
    if (!x) throw new HttpError(404, 'Sign-up not found.');
    db.prepare('DELETE FROM reminders WHERE id = ?').run(x.id);
    audit(me.id, 'delete', 'reminder', x.id, `Removed reminder sign-up ${x.channel === 'whatsapp' ? '+' + x.contact : x.contact}`);
    send(res, 200, { ok: true });
  });

  // ----- team -----
  r.add('GET', '/api/admin/users', ({ req, res }) => {
    requireUser(req, 'team.manage');
    send(res, 200, { users: db.prepare('SELECT * FROM users ORDER BY active DESC, role, name').all().map(userOut) });
  });

  r.add('POST', '/api/admin/users', async ({ req, res }) => {
    const me = requireUser(req, 'team.manage');
    const b = await readJson(req);
    const name = str(b.name, { max: 80, required: true, label: 'Name' });
    const email = str(b.email, { max: 254, required: true, label: 'Email' }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('That email looks a little off.');
    const role = oneOf(b.role, ROLES, 'Role');
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw bad('Someone on the team already uses that email.');
    const pw = tempPassword();
    const u = db.prepare('INSERT INTO users (name, email, role, password_hash, must_change_password) VALUES (?, ?, ?, ?, 1)').run(name, email, role, hashPassword(pw));
    audit(me.id, 'create', 'user', u.lastInsertRowid, `Added ${name} (${email}) as ${role}`);
    send(res, 201, { user: userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(u.lastInsertRowid)), tempPassword: pw });
  });

  const owners = () => db.prepare("SELECT COUNT(*) n FROM users WHERE role = 'owner' AND active = 1").get().n;

  r.add('PATCH', '/api/admin/users/:id', async ({ req, res, params }) => {
    const me = requireUser(req, 'team.manage');
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(params.id));
    if (!u) throw new HttpError(404, 'Team member not found.');
    const b = await readJson(req);
    const name = b.name !== undefined ? str(b.name, { max: 80, required: true, label: 'Name' }) : u.name;
    const role = b.role !== undefined ? oneOf(b.role, ROLES, 'Role') : u.role;
    const active = b.active !== undefined ? (b.active ? 1 : 0) : u.active;
    if (u.id === me.id && (role !== u.role || !active)) throw bad("You can't change your own role or switch off your own account.");
    if (u.role === 'owner' && u.active && (role !== 'owner' || !active) && owners() <= 1) throw bad('The shop needs at least one active owner. Make someone else an owner first.');
    db.prepare('UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?').run(name, role, active, u.id);
    if (!active) endAllSessions(u.id);
    const what = [];
    if (role !== u.role) what.push(`role ${u.role} → ${role}`);
    if (active !== u.active) what.push(active ? 'switched on' : 'switched off');
    if (name !== u.name) what.push(`renamed to ${name}`);
    audit(me.id, 'update', 'user', u.id, `${u.name}: ${what.join(', ') || 'no changes'}`);
    send(res, 200, { user: userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(u.id)) });
  });

  r.add('POST', '/api/admin/users/:id/reset-password', ({ req, res, params }) => {
    const me = requireUser(req, 'team.manage');
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(params.id));
    if (!u) throw new HttpError(404, 'Team member not found.');
    if (u.id === me.id) throw bad('Use “My account” to change your own password.');
    const pw = tempPassword();
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(hashPassword(pw), u.id);
    endAllSessions(u.id);
    audit(me.id, 'update', 'user', u.id, `Reset the password for ${u.name}`);
    send(res, 200, { tempPassword: pw });
  });

  // ----- settings -----
  r.add('GET', '/api/admin/settings', ({ req, res }) => {
    requireUser(req, 'settings.edit');
    send(res, 200, { settings: getSettings() });
  });

  r.add('PUT', '/api/admin/settings', async ({ req, res }) => {
    const me = requireUser(req, 'settings.edit');
    const b = await readJson(req);
    const before = getSettings();
    const patch = {};
    for (const k of Object.keys(SETTINGS_DEFAULTS)) {
      if (b[k] === undefined) continue;
      patch[k] = str(b[k], { max: 120, required: true, label: k });
    }
    if (patch.orderWhatsApp !== undefined) patch.orderWhatsApp = lkMobile(patch.orderWhatsApp, { required: true });
    if (patch.offerEnd !== undefined && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(patch.offerEnd)) throw bad('Offer end must be a date and time.');
    if (patch.couponCode !== undefined) patch.couponCode = patch.couponCode.toUpperCase().replace(/\s+/g, '');
    saveSettings(patch);
    const changed = Object.keys(patch).filter((k) => patch[k] !== before[k]);
    if (changed.length) audit(me.id, 'update', 'settings', null, `Changed shop settings: ${changed.join(', ')}`);
    send(res, 200, { settings: getSettings() });
  });

  // ----- activity -----
  r.add('GET', '/api/admin/activity', ({ req, res, url }) => {
    requireUser(req, 'activity.view');
    const before = Number(url.searchParams.get('before')) || Number.MAX_SAFE_INTEGER;
    const rows = db.prepare('SELECT a.*, u.name user FROM audit_log a LEFT JOIN users u ON u.id = a.user_id WHERE a.id < ? ORDER BY a.id DESC LIMIT 50').all(before);
    send(res, 200, { entries: rows.map((a) => ({ id: a.id, at: iso(a.at), user: a.user, action: a.action, entity: a.entity, entityId: a.entity_id, summary: a.summary })), more: rows.length === 50 });
  });
}

export function adminRoutes(router) {
  authRoutes(router);
  overviewRoutes(router);
  orderRoutes(router);
  productRoutes(router);
  peopleRoutes(router);
}
