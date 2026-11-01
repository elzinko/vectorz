#!/usr/bin/env tsx
/**
 * board-contract — régénère ou vérifie le schéma et l'exemple du contrat `ezk board show --json`
 * (fiche 20261029112813308, ADR-086).
 *
 *   pnpm --dir products/mega-city board:contract           # vérifie : code 1 si un fichier n'est plus à jour
 *   pnpm --dir products/mega-city board:contract --write   # régénère les deux fichiers
 *
 * Le format se change dans `src/core/board-contract.ts`, jamais dans les fichiers rangés.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderContractFiles } from '../src/io/board-contract-files.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = renderContractFiles();

if (process.argv.includes('--write')) {
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(megaCity, rel)), { recursive: true });
    writeFileSync(join(megaCity, rel), text);
    console.log(`écrit : ${rel}`);
  }
  process.exit(0);
}

const stale = Object.entries(files)
  .filter(([rel, text]) => !existsSync(join(megaCity, rel)) || readFileSync(join(megaCity, rel), 'utf8') !== text)
  .map(([rel]) => rel);
if (stale.length > 0) {
  console.error(`En clair : ${stale.length} fichier(s) du contrat ne sont plus à jour : ${stale.join(', ')}.`);
  console.error('Régénère-les : pnpm --dir products/mega-city board:contract --write');
  process.exit(1);
}
console.log('En clair : le schéma et l’exemple du contrat sont à jour.');
