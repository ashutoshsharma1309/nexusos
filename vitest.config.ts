import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Unit tests target the pure, framework-free logic — interpreters, the window
 * reducer, game AI, geometry — so they run in a plain Node environment with no
 * DOM or IndexedDB setup required.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
