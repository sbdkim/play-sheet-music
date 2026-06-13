import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VERCEL ? '/' : (process.env.PAGES_BASE ?? '/'),
  plugins: [react()],
  worker: {
    format: 'es'
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    exclude: ['tests/e2e/**', '**/node_modules/**']
  }
});
