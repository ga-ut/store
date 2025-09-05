const esbuild = require('esbuild');
const { execSync } = require('child_process');

const common = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  target: 'es2018',
  external: ['@ga-ut/store-core', 'vue']
};

// CommonJS build
esbuild.buildSync({ ...common, outfile: 'dist/index.js', format: 'cjs' });
// ESModule build
esbuild.buildSync({ ...common, outfile: 'dist/index.mjs', format: 'esm' });

// Type declarations with project references
execSync('pnpm exec tsc -b tsconfig.build.json');
