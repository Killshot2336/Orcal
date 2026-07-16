import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
copyFileSync(resolve(root, 'index.dev.html'), resolve(root, 'index.html'));
console.log('Restored Vite entry index.html from index.dev.html');
