/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — derlenen uygulama herhangi bir klasörden / USB'den açılabilsin.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2019' },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
