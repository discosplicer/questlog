import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    isolate: true,
    threads: false, // Run tests in a single thread to avoid DB race conditions
  },
}); 