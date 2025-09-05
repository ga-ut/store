import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    fileParallelism: false,
    sequence: { concurrent: false },
    deps: {
      inline: ['@sveltejs/vite-plugin-svelte', 'svelte']
    },
    dir: 'tests',
    reporters: [
      [
        'default',
        {
          summary: false
        }
      ]
    ],
    setupFiles: ['vitest.setup.ts']
  }
});
