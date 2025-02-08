const esbuild = require('esbuild');
const { copyFileSync } = require('fs');
const { execSync } = require('child_process');
const pkg = require('./package.json');

const external = [
  ...Object.keys(pkg.peerDependencies),
  ...Object.keys(pkg.devDependencies)
];

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  external,
  format: 'esm',
  target: 'es2018',
  bundle: true,
  supported: { 'import-meta': true }
});

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  external,
  format: 'cjs',
  target: 'es2018',
  bundle: true,
  supported: { 'import-meta': true }
});

execSync('pnpm tsc');
copyFileSync('dist/index.d.ts', 'dist/index.d.mts');
