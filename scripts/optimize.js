const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'uploads');
const OUT = path.join(__dirname, '..', 'uploads', 'opt');
const SIZES = [900, 1920];

fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC)
  .filter(f => /\.(jpg|jpeg)$/i.test(f) && !f.startsWith('.'));

async function processFile(file) {
  const input = path.join(SRC, file);
  const base = path.basename(file, path.extname(file));
  const meta = await sharp(input).metadata();

  for (const w of SIZES) {
    if (w > meta.width) continue; // don't upscale

    const resized = sharp(input).resize(w, null, { withoutEnlargement: true });

    await resized.clone()
      .avif({ quality: 72, effort: 4 })
      .toFile(path.join(OUT, `${base}-${w}.avif`));

    await resized.clone()
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(OUT, `${base}-${w}.jpg`));
  }
  process.stdout.write('.');
}

(async () => {
  console.log(`Processing ${files.length} images...`);
  // process in batches of 4 to avoid memory exhaustion
  for (let i = 0; i < files.length; i += 4) {
    await Promise.all(files.slice(i, i + 4).map(processFile));
  }
  console.log(`\nDone. Output → uploads/opt/`);

  // print size summary
  const origSize = files.reduce((s, f) => s + fs.statSync(path.join(SRC, f)).size, 0);
  const optFiles = fs.readdirSync(OUT);
  const optSize = optFiles.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`Original: ${(origSize/1024/1024).toFixed(0)} MB`);
  console.log(`Optimized: ${(optSize/1024/1024).toFixed(0)} MB`);
})();
