// Copies the Three.js ESM build into ./vendor so the site can be served
// as plain static files (local server + GitHub Pages) without a bundler.
// Run automatically after `npm install` (postinstall), or via `npm run vendor`.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const candidates = ['three.module.min.js', 'three.module.js'];
const buildDir = path.join(root, 'node_modules', 'three', 'build');

const found = candidates.find((f) => fs.existsSync(path.join(buildDir, f)));
if (!found) {
  console.error(
    `Could not find a Three.js ESM build in ${buildDir}.\n` +
      'Run "npm install" first.'
  );
  process.exit(1);
}

const destDir = path.join(root, 'vendor');
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(path.join(buildDir, found), path.join(destDir, found));

console.log(`vendored Three.js: node_modules/three/build/${found} -> vendor/${found}`);
