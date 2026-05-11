const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const DIST    = path.join(ROOT, 'dist');
const UPLOADS = path.join(ROOT, 'uploads');

const ROOT_EXCLUDES = new Set([
  'node_modules', '.git', 'dist', 'scripts',
  'package.json', 'package-lock.json',
  'worker.js', 'wrangler.toml',
]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (src === ROOT && ROOT_EXCLUDES.has(entry.name)) continue;
    // uploads/ root: skip original images, only copy opt/ subdir
    if (src === UPLOADS && entry.isFile()) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
copyDir(ROOT, DIST);
console.log('Build OK → dist/');
