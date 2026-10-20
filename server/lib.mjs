// Small HTTP helpers shared by the public and admin routes.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const bad = (msg) => new HttpError(400, msg);

export function send(res, status, data, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(data));
}

export function readJson(req, limit = 10_000) {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { fail(new HttpError(413, 'Request too large.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { ok(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { fail(bad('Invalid JSON.')); }
    });
    req.on('error', fail);
  });
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export const clientIp = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';

/** Sliding-window limiter: `limit` hits per `windowMs` per key. Returns true when over the limit. */
export function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
    return recent.length > limit;
  };
}

/** Counts failures only (e.g. wrong passwords), so people who sign in correctly are never locked out. */
export function failureCounter(limit, windowMs) {
  const fails = new Map();
  const recent = (key) => (fails.get(key) || []).filter((t) => Date.now() - t < windowMs);
  return {
    blocked: (key) => recent(key).length >= limit,
    fail: (key) => fails.set(key, [...recent(key), Date.now()]),
    clear: (key) => fails.delete(key),
  };
}

/** Tiny router: add('GET', '/api/orders/:ref', handler) → handler(ctx) with ctx.params. */
export function createRouter() {
  const routes = [];
  return {
    add(method, pattern, handler) {
      const keys = [];
      const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
      routes.push({ method, re, keys, handler });
    },
    match(method, path) {
      let pathMatched = false;
      for (const r of routes) {
        const m = r.re.exec(path);
        if (!m) continue;
        pathMatched = true;
        if (r.method !== method) continue;
        const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        return { handler: r.handler, params };
      }
      return pathMatched ? 'method' : null;
    },
  };
}

// ---------- validation helpers ----------

export const str = (v, { max = 200, required = false, label = 'This field' } = {}) => {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  if (required && !s) throw bad(`${label} is required.`);
  if (s.length > max) throw bad(`${label} is too long (max ${max} characters).`);
  return s;
};

export const int = (v, { min = 0, max = 10_000_000, label = 'Number' } = {}) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${label} must be a whole number between ${min} and ${max}.`);
  return n;
};

export const oneOf = (v, list, label = 'Value') => {
  if (!list.includes(v)) throw bad(`${label} must be one of: ${list.join(', ')}.`);
  return v;
};

export const isoDate = (v, label = 'Date') => {
  if (v == null || v === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) throw bad(`${label} must be a date (YYYY-MM-DD).`);
  return String(v);
};

/** Sri Lankan mobile → 94XXXXXXXXX, or null when empty. */
export function lkMobile(raw, { required = false } = {}) {
  const v = String(raw ?? '').trim();
  if (!v) { if (required) throw bad('Phone number is required.'); return null; }
  let d = v.replace(/\D/g, '');
  if (d.startsWith('94')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (!/^7\d{8}$/.test(d)) throw bad('Please enter a Sri Lankan mobile number, e.g. 71 234 5678.');
  return `94${d}`;
}

export const json = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; } };
