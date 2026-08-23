#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
/**
 * regen-map-data — régénère le bloc de données géré de la carte interactive
 * (`diagrams/methode-mega-city/carte-interactive.html`) depuis le catalogue réel.
 *
 *   pnpm --dir products/mega-city map:data
 *
 * Le cœur (map-data.ts) compile les données, PUR et déterministe ; ce script est le
 * bord I/O — il lit/écrit le HTML de la carte, rien de plus. La carte ne peut ainsi
 * dessiner QUE ce qui existe dans les fichiers (épic « carte fidèle », PR #162).
 */
import { fileURLToPath } from 'node:url';
import { buildMapDataBlock, upsertMapDataBlock } from '../src/core/map-data.js';
import { loadCatalog } from '../src/loaders/catalog.js';
import { loadMethodDoc } from '../src/loaders/method.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const mapPath = join(repoRoot, 'diagrams', 'methode-mega-city', 'carte-interactive.html');

const catalog = loadCatalog(megaCity);
// La méthode (ceremonies.yml) est validée contre le catalogue DANS buildMapData —
// une référence fausse fait échouer cette régénération (garde-fou du panel).
const block = buildMapDataBlock(catalog, loadMethodDoc(megaCity));
const before = readFileSync(mapPath, 'utf8');
const after = upsertMapDataBlock(before, block);

if (after === before) {
  console.log('regen-map-data: carte-interactive.html déjà à jour.');
} else {
  writeFileSync(mapPath, after);
  console.log('regen-map-data: carte-interactive.html régénérée depuis le catalogue.');
}
