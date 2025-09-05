import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    fileParallelism: false,
    sequence: { concurrent: false },
    deps: {
      inline: ['@vitejs/plugin-vue', 'vue']
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
