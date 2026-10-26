import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Preview-only host allowance: extend (never replace) the host list with the sandbox
// wildcard, gated on the exact preview flag. Vite >= 6.1 also appends the platform's
// __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS automatically.
const previewMode = process.env.BASE44_PREVIEW_MODE === '1';
const extraHosts = previewMode && process.env.BASE44_SANDBOX_HOST_DOMAIN
  ? [`.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`]
  : [];

const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    ...(extraHosts.length ? { allowedHosts: extraHosts } : {}),
    // Single-origin wiring: the browser only ever talks to this dev server, so session
    // cookies stay first-party and no CORS setup is needed.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
      '/uploads': { target: apiTarget, changeOrigin: false },
      '/sitemap.xml': { target: apiTarget, changeOrigin: false },
      '/robots.txt': { target: apiTarget, changeOrigin: false },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
