// Admin authentication: password hashing, cookie sessions and role-based permissions.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.mjs';
import { HttpError, parseCookies } from './lib.mjs';

export const ROLES = ['owner', 'manager', 'staff'];

/**
 * What each role may do. The server checks these on every admin request;
 * the dashboard only uses them to hide what a person can't use.
 */
export const PERMISSIONS = {
  owner: ['orders.view', 'orders.edit', 'orders.cancel', 'revenue.view', 'products.view', 'products.edit', 'customers.view',
    'reminders.view', 'reminders.manage', 'settings.edit', 'activity.view', 'team.manage'],
  manager: ['orders.view', 'orders.edit', 'orders.cancel', 'revenue.view', 'products.view', 'products.edit', 'customers.view',
    'reminders.view', 'reminders.manage', 'settings.edit', 'activity.view'],
  staff: ['orders.view', 'orders.edit', 'products.view', 'customers.view', 'reminders.view'],
};

const COOKIE = 'gbd_admin';
const SESSION_DAYS = 14;
const secureCookies = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === '1';

// ---------- passwords ----------

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(pw, stored) {
  const [kind, salt, hash] = String(stored).split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = scryptSync(pw, Buffer.from(salt, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(actual, expected);
}

export function checkNewPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 10) throw new HttpError(400, 'Use at least 10 characters for the password.');
  if (pw.length > 200) throw new HttpError(400, 'That password is too long.');
  if (/^(.)\1+$/.test(pw) || /^(password|1234567890|qwertyuiop)/i.test(pw)) throw new HttpError(400, 'That password is too easy to guess.');
}

/** Readable temporary password for new team members, e.g. "plum-kite-4821". */
export function tempPassword() {
  const words = ['rose', 'plum', 'kite', 'mint', 'bear', 'gift', 'bow', 'star', 'moon', 'pearl', 'sugar', 'candy', 'lily', 'honey', 'cocoa', 'ribbon'];
  const pick = () => words[randomBytes(1)[0] % words.length];
  return `${pick()}-${pick()}-${pick()}-${String(1000 + (randomBytes(2).readUInt16BE() % 9000))}`;
}

// ---------- sessions ----------

const iso = (t) => (t ? `${t.replace(' ', 'T')}Z` : null);
const sha = (t) => createHash('sha256').update(t).digest('hex');

export function createSession(res, userId) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha(token), userId, expires.toISOString());
  setCookie(res, token, expires);
}

function setCookie(res, value, expires) {
  const parts = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Expires=${expires.toUTCString()}`];
  if (secureCookies) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function destroySession(req, res) {
  const token = parseCookies(req)[COOKIE];
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
  setCookie(res, '', new Date(0));
}

export function endAllSessions(userId) {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

/** The signed-in user for this request, or null. */
export function currentUser(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const row = db.prepare(`SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`).get(sha(token));
  if (!row) return null;
  if (new Date(row.expires_at) < new Date() || !row.active) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
    return null;
  }
  return userOut(row);
}

export const userOut = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, active: !!u.active,
  mustChangePassword: !!u.must_change_password, createdAt: iso(u.created_at), lastLoginAt: iso(u.last_login_at),
  permissions: PERMISSIONS[u.role] || [],
});

export function can(user, perm) {
  return !!user && (PERMISSIONS[user.role] || []).includes(perm);
}

/** Throws 401 / 403 unless the user is signed in (and has `perm`, when given). */
export function requireUser(req, perm) {
  const user = currentUser(req);
  if (!user) throw new HttpError(401, 'Please sign in again.');
  if (user.mustChangePassword && perm !== '__self') throw new HttpError(403, 'Please set a new password first.');
  if (perm && perm !== '__self' && !can(user, perm)) throw new HttpError(403, "Your role doesn't allow this. Ask the shop owner if you need access.");
  return user;
}

// Clean up expired sessions now and then.
setInterval(() => db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString()), 3_600_000).unref();
