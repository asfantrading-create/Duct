#!/usr/bin/env node
// Bundles the renderer (ESM + three.js) into dist/renderer with esbuild.
import * as esbuild from 'esbuild';
import { mkdirSync, copyFileSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'renderer');
mkdirSync(out, { recursive: true });
const watch = process.argv.includes('--watch');

const options = {
  entryPoints: [join(root, 'src', 'renderer', 'app.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome120'],
  outfile: join(out, 'app.js'),
  sourcemap: watch ? 'inline' : false,
  minify: !watch,
  logLevel: 'info',
  define: { 'process.env.NODE_ENV': watch ? '"development"' : '"production"' },
};

// Static files that ship next to the bundle
function copyStatic() {
  copyFileSync(join(root, 'src', 'renderer', 'index.html'), join(out, 'index.html'));
  copyFileSync(join(root, 'src', 'renderer', 'styles.css'), join(out, 'styles.css'));
  cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });
  const fontsDir = join(root, 'src', 'renderer', 'fonts');
  if (existsSync(fontsDir)) cpSync(fontsDir, join(out, 'fonts'), { recursive: true });
}

if (watch) {
  const ctx = await esbuild.context(options);
  copyStatic();
  await ctx.watch();
  console.log('watching renderer...');
} else {
  await esbuild.build(options);
  copyStatic();
  console.log('renderer bundled ->', out);
}
