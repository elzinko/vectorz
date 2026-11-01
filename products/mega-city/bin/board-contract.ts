#!/usr/bin/env tsx
/**
 * board-contract — régénère ou vérifie les schémas et les exemples des contrats JSON de la méthode :
 * `ezk board show --json` et `ezk backlog show --json` (ADR-086 ; liste dans `src/io/contract-files.ts`).
 *
 *   pnpm --dir products/mega-city board:contract           # vérifie : code 1 si un fichier n'est plus à jour
 *   pnpm --dir products/mega-city board:contract --write   # régénère tous les fichiers
 *
 * Un format se change dans son schéma zod (`src/core/board-contract.ts`, `src/core/fiche-detail.ts`),
 * jamais dans les fichiers rangés.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderContractFiles } from '../src/io/contract-files.js';

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
  console.error(`En clair : ${stale.length} fichier(s) des contrats ne sont plus à jour : ${stale.join(', ')}.`);
  console.error('Régénère-les : pnpm --dir products/mega-city board:contract --write');
  process.exit(1);
}
console.log('En clair : les schémas et les exemples des contrats sont à jour.');
