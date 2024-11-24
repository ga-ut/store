import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    dir: 'tests',
    reporters: 'basic',
    setupFiles: ['tests/setup.ts'],
    coverage: {
      include: ['src/**/'],
      reporter: ['text', 'json', 'html', 'text-summary'],
      reportsDirectory: './coverage/'
    }
  }
});
