import esbuild from 'esbuild';
import { copyFileSync } from 'fs';
import { execSync } from 'child_process';

esbuild.buildSync({
    entryPoints: ['src/index.ts'],
    outfile: 'index.js',
    format: 'esm',
    target: 'es2018',
    bundle: true,
    supported: { 'import-meta': true }
});

esbuild.buildSync({
    entryPoints: ['src/index.ts'],
    outfile: 'index.cjs',
    format: 'cjs',
    target: 'es2018',
    bundle: true,
    supported: { 'import-meta': true }
});

execSync('npx tsc');
copyFileSync('index.d.ts', 'index.d.cts');