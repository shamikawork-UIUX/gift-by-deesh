import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Allow Cloudflare quick-tunnel links (for sharing a live preview on phones)
  server: {
    allowedHosts: ['.trycloudflare.com'],
    // API server (server/index.mjs) — run it with `npm run api` alongside `npm run dev`.
    proxy: { '/api': 'http://localhost:8787' },
  },
});
