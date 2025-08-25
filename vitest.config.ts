import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      provider: 'v8',
      reportsDirectory: './coverage',
    },
  },
});
