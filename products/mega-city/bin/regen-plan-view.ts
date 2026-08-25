#!/usr/bin/env tsx
/**
 * regen-plan-view — régénère le bloc de données de la vue « Plan » (l'onglet du board,
 * fiche 20260825213807501) dans `diagrams/avancement/board.html`, depuis `features/PLAN.md`
 * + le backlog réel.
 *
 *   pnpm --dir products/mega-city plan-view:regen
 *
 * Même patron que `regen-avancement.ts` : le cœur (plan-view-data.ts) compile, PUR ; ce
 * script est le bord I/O — il lit PLAN.md + les fiches et écrit le HTML entre les marqueurs
 * `ezk-plan-data:*` (disjoints de ceux d'avancement). L'onglet ne peut dessiner QUE ce qui
 * existe dans PLAN.md + les fiches.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlanViewDataBlock, upsertPlanViewDataBlock } from '../src/core/plan-view-data.js';
import { loadFiches } from '../src/loaders/fiches.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const boardPath = join(repoRoot, 'diagrams', 'avancement', 'board.html');
const planPath = join(repoRoot, 'features', 'PLAN.md');

const block = buildPlanViewDataBlock(readFileSync(planPath, 'utf8'), loadFiches(repoRoot));
const before = readFileSync(boardPath, 'utf8');
const after = upsertPlanViewDataBlock(before, block);

if (after === before) {
  console.log('regen-plan-view: board.html déjà à jour.');
} else {
  writeFileSync(boardPath, after);
  console.log('regen-plan-view: bloc plan régénéré depuis PLAN.md + backlog.');
}
