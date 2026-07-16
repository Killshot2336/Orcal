/**
 * Copies the Vite production build into the repo root so GitHub Pages
 * (legacy deploy from branch main /) serves a real SPA instead of raw TSX.
 */
import { cpSync, copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('Missing dist/index.html — run the Vite build first.');
  process.exit(1);
}

const assetsOut = resolve(root, 'assets');
if (existsSync(assetsOut)) rmSync(assetsOut, { recursive: true, force: true });
mkdirSync(assetsOut, { recursive: true });
cpSync(resolve(dist, 'assets'), assetsOut, { recursive: true });

copyFileSync(resolve(dist, 'index.html'), resolve(root, 'index.html'));

if (existsSync(resolve(dist, 'favicon.svg'))) {
  copyFileSync(resolve(dist, 'favicon.svg'), resolve(root, 'favicon.svg'));
}

writeFileSync(resolve(root, '.nojekyll'), '');
console.log('Published dist → repo root for GitHub Pages (legacy / branch deploy).');
