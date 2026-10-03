// Assembles the deployable static site into ./dist (used by the Pages workflow
// and runnable locally with `npm run pages`).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const files = ['index.html', 'style.css'];
const dirs = ['src', 'vendor'];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const f of files) {
  fs.copyFileSync(path.join(root, f), path.join(dist, f));
}

for (const d of dirs) {
  const from = path.join(root, d);
  if (!fs.existsSync(from)) {
    console.error(`Missing "${d}/" - run "npm install" (or "npm run vendor") first.`);
    process.exit(1);
  }
  fs.cpSync(from, path.join(dist, d), { recursive: true });
}

console.log(`site assembled in ${path.relative(root, dist)}/`);
