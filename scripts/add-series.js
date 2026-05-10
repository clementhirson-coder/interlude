#!/usr/bin/env node
/**
 * Crée une nouvelle série vide.
 *
 * Usage :
 *   node scripts/add-series.js <slug> "Titre" "Lieux"
 *
 * Exemple :
 *   node scripts/add-series.js iceland "Iceland" "Reykjavik · Snæfellsnes"
 */

const fs   = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data.json');

const [slug, title, loc] = process.argv.slice(2);

if (!slug || !title) {
  console.error('\n  Usage: node scripts/add-series.js <slug> "Titre" "Lieux"');
  console.error('  Exemple: node scripts/add-series.js iceland "Iceland" "Reykjavik · Snæfellsnes"\n');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));

if (data.series[slug]) {
  console.error(`\n  La série "${slug}" existe déjà.\n`);
  process.exit(1);
}

// compter les séries pour le numéro romain
const count = Object.keys(data.series).length + 1;
const romans = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

data.series[slug] = {
  num:    `Series ${romans[count - 1] || count}`,
  title:  title,
  cover:  '',
  right:  `${loc || title}<br/><strong>2026</strong>`,
  loc:    loc || title,
  q:      title.toUpperCase(),
  txt:    `<p>Description de la série "${title}" à compléter.</p>`,
  next:   Object.keys(data.series)[0],
  photos: []
};

// faire pointer le "next" de la dernière série existante vers la nouvelle
const keys = Object.keys(data.series);
if (keys.length > 1) {
  const prev = keys[keys.length - 2];
  data.series[prev].next = slug;
}

fs.writeFileSync(DATA, JSON.stringify(data, null, 2));

console.log(`\n  ✓ Série "${title}" créée (slug: ${slug})`);
console.log(`  → Ajoute des photos avec : node scripts/add-photo.js ${slug} <fichier.jpg> "Légende"`);
console.log(`  → La série sera accessible sur : series.html?s=${slug}\n`);
console.log(`  N'oublie pas d'ajouter la couverture :`);
console.log(`    node scripts/add-photo.js ${slug} cover.jpg "Légende de la cover"`);
console.log(`  Puis dans data.json, mets "cover" avec le nom de ce fichier.\n`);
