#!/usr/bin/env tsx
/**
 * fiche-rows — lit des fiches PAR LE LOADER et imprime une ligne par fiche : onze champs de
 * front-matter séparés par le séparateur US (\x1f), dans l'ordre des anciens `extract()` awk.
 * C'est le point d'entrée des scripts bash (règle `development/fiche-read-via-loader`) : ils
 * n'ont plus à re-parser le front-matter.
 *
 *   tsx bin/fiche-rows.ts [--default-product <produit>] <fiche.md>...
 *
 * Une fiche illisible arrête tout (exit 2) : on ne fabrique pas de ligne à moitié vide.
 * Le cœur est pur (src/loaders/fiche-rows.ts) ; ce script n'est que le bord I/O.
 */
import { readFileSync } from 'node:fs';
import { formatRow } from '../src/loaders/fiche-rows.js';

const args = process.argv.slice(2);
let defaultProduct = '';
const files: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--default-product') defaultProduct = args[++i] ?? '';
  else files.push(args[i]);
}

for (const file of files) {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`✗ fiche illisible : ${file} (${err instanceof Error ? err.message : err})`);
    process.exit(2);
  }
  process.stdout.write(`${formatRow(text, defaultProduct)}\n`);
}
