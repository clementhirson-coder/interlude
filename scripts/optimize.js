const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC   = path.join(__dirname, '..', 'uploads');
const OUT   = path.join(__dirname, '..', 'uploads', 'opt');
const SIZES = [900, 1920];

fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC)
  .filter(f => /\.(jpg|jpeg)$/i.test(f) && !f.startsWith('.'));

function makeWatermark(imageWidth) {
  const fontSize = Math.max(10, Math.round(imageWidth * 0.012));
  const pad      = Math.round(imageWidth * 0.018);
  const text     = '© Clément Hirson';
  const svgW     = Math.ceil(text.length * fontSize * 0.55) + pad;
  const svgH     = fontSize + pad;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">` +
    `<text x="${svgW - Math.round(pad / 2)}" y="${fontSize}" text-anchor="end" ` +
    `font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="${fontSize}" ` +
    `fill="white" opacity="0.45">${text}</text>` +
    `</svg>`
  );
}

async function processFile(file) {
  const input = path.join(SRC, file);
  const base  = path.basename(file, path.extname(file));
  const meta  = await sharp(input).metadata();

  for (const w of SIZES) {
    if (w > meta.width) continue;

    const { data, info } = await sharp(input)
      .resize(w, null, { withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });

    const watermark  = makeWatermark(info.width);
    const watermarked = sharp(data).composite([{ input: watermark, gravity: 'southeast' }]);

    await watermarked.clone()
      .avif({ quality: 72, effort: 4 })
      .toFile(path.join(OUT, `${base}-${w}.avif`));

    await watermarked.clone()
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(OUT, `${base}-${w}.jpg`));
  }
  process.stdout.write('.');
}

(async () => {
  console.log(`Processing ${files.length} images...`);
  for (let i = 0; i < files.length; i += 4) {
    await Promise.all(files.slice(i, i + 4).map(processFile));
  }
  console.log(`\nDone. Output → uploads/opt/`);

  const origSize = files.reduce((s, f) => s + fs.statSync(path.join(SRC, f)).size, 0);
  const optFiles = fs.readdirSync(OUT);
  const optSize  = optFiles.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`Original: ${(origSize/1024/1024).toFixed(0)} MB`);
  console.log(`Optimized: ${(optSize/1024/1024).toFixed(0)} MB`);
})();
