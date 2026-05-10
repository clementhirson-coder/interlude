#!/usr/bin/env node
/**
 * Ajoute une photo à une série.
 *
 * Usage :
 *   node scripts/add-photo.js <série> <fichier.jpg> "Légende · Lieu"
 *
 * Exemple :
 *   node scripts/add-photo.js japan /Users/moi/Bureau/tokyo.jpg "Shibuya · Nuit"
 */

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const ROOT    = path.join(__dirname, '..');
const UPLOADS = path.join(ROOT, 'uploads');
const OPT     = path.join(ROOT, 'uploads', 'opt');
const DATA    = path.join(ROOT, 'data.json');

// ── arguments ──────────────────────────────────────────────────────────────
const [seriesKey, srcFile, legend] = process.argv.slice(2);

if (!seriesKey || !srcFile || !legend) {
  console.error('\n  Usage: node scripts/add-photo.js <série> <fichier.jpg> "Légende · Lieu"');
  console.error('  Exemple: node scripts/add-photo.js japan /Bureau/tokyo.jpg "Shibuya · Nuit"\n');
  process.exit(1);
}

if (!fs.existsSync(srcFile)) {
  console.error(`\n  Fichier introuvable : ${srcFile}\n`);
  process.exit(1);
}

// ── charger les données ────────────────────────────────────────────────────
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));

if (!data.series[seriesKey]) {
  const available = Object.keys(data.series).join(', ');
  console.error(`\n  Série inconnue : "${seriesKey}". Séries disponibles : ${available}\n`);
  process.exit(1);
}

const serie = data.series[seriesKey];

// ── copier le fichier dans uploads/ ───────────────────────────────────────
const ext      = path.extname(srcFile).toLowerCase();
const basename = path.basename(srcFile, ext);
const destName = basename + ext;
const destPath = path.join(UPLOADS, destName);

if (!fs.existsSync(destPath)) {
  fs.copyFileSync(srcFile, destPath);
  console.log(`✓ Photo copiée → uploads/${destName}`);
} else {
  console.log(`  (uploads/${destName} existe déjà, pas de copie)`);
}

// ── optimiser (900 + 1920) ─────────────────────────────────────────────────
async function optimize() {
  fs.mkdirSync(OPT, { recursive: true });
  const meta = await sharp(destPath).metadata();
  const sizes = [900, 1920];
  for (const w of sizes) {
    const r = sharp(destPath).resize(w, null);
    await r.clone().avif({ quality: 72, effort: 4 }).toFile(path.join(OPT, `${basename}-${w}.avif`));
    await r.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OPT, `${basename}-${w}.jpg`));
    console.log(`✓ Optimisée ${w}px (AVIF + JPEG)`);
  }
}

// ── générer le prochain code (ex: JA·17) ──────────────────────────────────
function nextCode(serie) {
  const prefix = { japan: 'JA', lanzarote: 'LZ', elsewhere: 'EW' }[seriesKey]
    || seriesKey.slice(0, 2).toUpperCase();
  const n = serie.photos.length + 1;
  return `${prefix}·${String(n).padStart(2, '0')}`;
}

// ── mettre à jour data.json ────────────────────────────────────────────────
function updateData() {
  serie.photos.push({
    file:  destName,
    place: legend,
    code:  nextCode(serie)
  });
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
  console.log(`✓ data.json mis à jour (${serie.photos.length} photos dans "${seriesKey}")`);
}

// ── exécuter ───────────────────────────────────────────────────────────────
optimize()
  .then(updateData)
  .then(() => {
    console.log('\n  Tout est prêt. La photo est visible sur le site.\n');
  })
  .catch(err => {
    console.error('\n  Erreur :', err.message, '\n');
    process.exit(1);
  });
