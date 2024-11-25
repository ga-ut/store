import esbuild from 'esbuild';
import { copyFileSync } from 'fs';
import { execSync } from 'child_process';
import pkg from './package.json' assert { type: 'json' };

const external = [
  ...Object.keys(pkg.peerDependencies),
  ...Object.keys(pkg.devDependencies)
];

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  outfile: 'build/index.js',
  external,
  format: 'esm',
  target: 'es2018',
  bundle: true,
  supported: { 'import-meta': true }
});

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  outfile: 'build/index.cjs',
  external,
  format: 'cjs',
  target: 'es2018',
  bundle: true,
  supported: { 'import-meta': true }
});

esbuild.buildSync({
  entryPoints: ['src/react/useStore.ts'],
  outfile: 'build/react/useStore.js',
  external,
  format: 'esm',
  target: 'es2018',
  bundle: true,
  supported: { 'import-meta': true }
});

esbuild.buildSync({
  entryPoints: ['src/react/useStore.ts'],
  outfile: 'build/react/useStore.cjs',
  external,
  format: 'cjs',
  target: 'es2018',
  bundle: true,
  supported: { 'import-meta': true }
});

execSync('npx tsc');
copyFileSync('build/index.d.ts', 'build/index.d.cts');
copyFileSync('build/react/useStore.d.ts', 'build/react/useStore.d.cts');
