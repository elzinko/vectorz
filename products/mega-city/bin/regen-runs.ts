#!/usr/bin/env tsx
/**
 * regen-runs — régénère le bloc de données géré de la vue « Historique des runs »
 * (`diagrams/runs/runs.html`) depuis les récits `docs/sessions/`.
 *
 *   pnpm --dir products/mega-city runs:regen
 *
 * Le cœur (runs-data.ts) compile les données, PUR et déterministe ; ce script est le bord
 * I/O — il lit les récits, lit/écrit le HTML de la vue, rien de plus (même patron que
 * regen-avancement.ts). Un test d'invariant rougit si le HTML committé diverge du regen.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRunsDataBlock, upsertRunsDataBlock } from '../src/core/runs-data.js';
import { loadRuns } from '../src/loaders/runs.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const viewPath = join(repoRoot, 'diagrams', 'runs', 'runs.html');

const block = buildRunsDataBlock(loadRuns(repoRoot));
const before = readFileSync(viewPath, 'utf8');
const after = upsertRunsDataBlock(before, block);

if (after === before) {
  console.log('regen-runs: runs.html déjà à jour.');
} else {
  writeFileSync(viewPath, after);
  console.log('regen-runs: runs.html régénéré depuis docs/sessions/.');
}
