// GiftsByDeesh server — zero dependencies (Node 22.13+ built-in http + sqlite).
//
//   /api/*        public storefront API   (routes-public.mjs)
//   /api/admin/*  admin dashboard API     (routes-admin.mjs, cookie sessions + roles)
//   /uploads/*    product photos uploaded in the dashboard
//   everything else → the built site in dist/ (run `npm run build` first)
//
// Env: PORT (8787), DATA_DIR (data/), DB_PATH, SETUP_CODE (required in production for the first owner), NODE_ENV,
//      PUBLIC_ORIGIN (site URL, when a proxy rewrites the Host header).

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { dbPath, ROOT, UPLOAD_DIR } from './db.mjs';
import { createRouter, HttpError, send } from './lib.mjs';
import { publicRoutes } from './routes-public.mjs';
import { adminRoutes } from './routes-admin.mjs';

const PORT = Number(process.env.PORT) || 8787;
const DIST = join(ROOT, 'dist');

const router = createRouter();
publicRoutes(router);
adminRoutes(router);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function serveFile(res, base, path, { spa = false } = {}) {
  let file = normalize(join(base, decodeURIComponent(path)));
  if (file !== base && !file.startsWith(base + sep)) return send(res, 403, { error: 'Forbidden.' });
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (!spa) return send(res, 404, { error: 'Not found.' });
    file = join(base, 'index.html');
  }
  const immutable = file.startsWith(join(base, 'assets')) || base === UPLOAD_DIR; // hashed / uniquely named files
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(readFileSync(file));
}

/**
 * Blocks cross-site form posts to the admin API (on top of SameSite=Strict cookies).
 * Behind a reverse proxy that rewrites Host, set PUBLIC_ORIGIN (e.g. https://giftsbydeesh.lk).
 */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (process.env.PUBLIC_ORIGIN && origin === process.env.PUBLIC_ORIGIN) return true;
  try {
    const host = new URL(origin).host;
    return host === req.headers.host || host === req.headers['x-forwarded-host'];
  } catch {
    return false;
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://x');
  const path = url.pathname;
  try {
    if (path.startsWith('/api/')) {
      if (path.startsWith('/api/admin/') && req.method !== 'GET' && !sameOrigin(req)) throw new HttpError(403, 'Cross-site request blocked.');
      const m = router.match(req.method, path);
      if (m === 'method') return send(res, 405, { error: 'Method not allowed.' });
      if (!m) return send(res, 404, { error: 'Not found.' });
      await m.handler({ req, res, url, params: m.params });
    } else if (path.startsWith('/uploads/')) {
      serveFile(res, UPLOAD_DIR, path.slice('/uploads/'.length));
    } else if (!existsSync(DIST)) {
      send(res, 404, { error: 'Site not built. Run `npm run build`, or use `npm run dev` for development.' });
    } else {
      serveFile(res, DIST, path, { spa: true });
    }
  } catch (e) {
    if (e instanceof HttpError) send(res, e.status, { error: e.message });
    else { console.error(e); send(res, 500, { error: 'Something went wrong on our side. Please try again.' }); }
  }
}).listen(PORT, () => console.log(`GiftsByDeesh server on http://localhost:${PORT}  (db: ${dbPath})`));
