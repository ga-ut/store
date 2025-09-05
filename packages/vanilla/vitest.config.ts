import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    fileParallelism: false,
    sequence: { concurrent: false },
    dir: 'tests',
    reporters: [
      [
        'default',
        {
          summary: false
        }
      ]
    ]
  }
});
