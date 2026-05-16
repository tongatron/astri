/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
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
  return {
  base: command === 'build' ? (process.env.VITE_BASE ?? '/astri/') : '/',
  plugins: [react(), tailwindcss()],
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
  },
  };
});
