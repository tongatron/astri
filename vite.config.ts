/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';
import { execSync } from 'node:child_process';

function gitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const isoDate = execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim();
    return { hash, isoDate };
  } catch {
    return { hash: 'dev', isoDate: new Date().toISOString() };
  }
}

export default defineConfig(({ command }) => {
  const { hash, isoDate } = gitInfo();
  const base = command === 'build' ? (process.env.VITE_BASE ?? '/astri/') : '/';
  const analyze = process.env.ANALYZE === '1';
  return {
  base,
  plugins: [
    react(),
    tailwindcss(),
    analyze &&
      visualizer({
        filename: 'dist/bundle-stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
    VitePWA({
      registerType: 'autoUpdate',
      base,
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Astri — Cielo notturno',
        short_name: 'Astri',
        description: 'Esplora il cielo notturno dal tuo balcone: posizioni in tempo reale di Sole, Luna e pianeti.',
        theme_color: '#060e2e',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache app shell with StaleWhileRevalidate; long-lived assets CacheFirst.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            // Nominatim geocoding — network first, fall back to cache
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nominatim-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  define: {
    __GIT_HASH__: JSON.stringify(hash),
    __GIT_DATE__: JSON.stringify(isoDate),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  };
});
