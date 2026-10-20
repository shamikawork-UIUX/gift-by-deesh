import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Allow Cloudflare quick-tunnel links (for sharing a live preview on phones)
  server: {
    allowedHosts: ['.trycloudflare.com'],
    // API server (server/index.mjs) — run it with `npm run api` alongside `npm run dev`. /uploads = product photos.
    // changeOrigin: false keeps the browser's Host header, which the API's same-origin check compares with Origin.
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: false },
      '/uploads': { target: 'http://localhost:8787', changeOrigin: false },
    },
  },
});
