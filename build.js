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
  outfile: 'build/index.mjs',
  external,
  format: 'esm',
  target: 'es2018',
  bundle: true,
  supported: { 'import-meta': true }
});

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  outfile: 'build/index.js',
  external,
  format: 'cjs',
  target: 'es2018',
  bundle: true,
  supported: { 'import-meta': true }
});

execSync('npx tsc');
copyFileSync('build/index.d.ts', 'build/index.d.mts');
