import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const prod = process.argv.includes('--prod');
const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'friedzooki.bundle.js',
  loader: { '.wasm': 'dataurl' },
  format: 'iife',
  platform: 'browser',
  target: ['chrome90', 'safari14', 'firefox88'],
  minify: prod,
  sourcemap: !prod,
  define: {
    'process.env.NODE_ENV': prod ? '"production"' : '"development"'
  },
  logLevel: 'info',
});

if (watch) {
  await ctx.watch();
  console.log('watching...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('✓ built friedzooki.bundle.js');
}
