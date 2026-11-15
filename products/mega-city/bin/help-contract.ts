#!/usr/bin/env tsx
/**
 * help-contract — régénère ou vérifie le schéma et l'exemple du contrat `ezk help --json`
 * (fiche 20261114131613129, ADR-086 ; fichiers listés dans `src/io/help-contract-files.ts`).
 *
 *   pnpm --dir products/mega-city help:contract           # vérifie : code 1 si un fichier n'est plus à jour
 *   pnpm --dir products/mega-city help:contract --write   # régénère les fichiers
 *
 * Un format se change dans son schéma zod (`src/core/help-json.ts`), jamais dans les fichiers rangés.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHelpContractFiles } from '../src/io/help-contract-files.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = renderHelpContractFiles();

if (process.argv.includes('--write')) {
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(megaCity, rel)), { recursive: true });
    writeFileSync(join(megaCity, rel), text);
    console.log(`écrit : ${rel}`);
  }
} else {
  const stale = Object.entries(files)
    .filter(([rel, text]) => !existsSync(join(megaCity, rel)) || readFileSync(join(megaCity, rel), 'utf8') !== text)
    .map(([rel]) => rel);
  if (stale.length > 0) {
    console.error(`En clair : ${stale.length} fichier(s) du contrat ne sont plus à jour : ${stale.join(', ')}.`);
    console.error('Régénère-les : pnpm --dir products/mega-city help:contract --write');
    process.exitCode = 1;
  } else {
    console.log('En clair : le schéma et l’exemple du contrat de l’aide sont à jour.');
  }
}
