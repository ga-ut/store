import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    preserveSymlinks: true,
    alias: {
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(
        __dirname,
        '../../node_modules/react/jsx-runtime.js'
      )
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
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
    ],
    setupFiles: ['vitest.setup.ts']
  }
});
