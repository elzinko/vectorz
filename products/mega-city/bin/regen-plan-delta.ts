#!/usr/bin/env tsx
/**
 * regen-plan-delta — régénère le bloc de données de l'ÉCART PLAN (fiche 20260828165644386)
 * dans `diagrams/avancement/board.html`, depuis `features/PLAN.md` + le backlog réel.
 *
 *   pnpm --dir products/mega-city plan-delta:regen
 *
 * Même patron que `regen-plan-view.ts` : le cœur (`plan-delta-data.ts`) compile, PUR ; ce
 * script est le bord I/O — il lit PLAN.md + les fiches et écrit le HTML entre les marqueurs
 * `ezk-plan-delta:*` (disjoints de ceux d'avancement et de plan-view). L'encart ne peut
 * montrer QUE ce qui existe dans PLAN.md + les fiches.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlanDeltaBlock, upsertPlanDeltaBlock } from '../src/core/plan-delta-data.js';
import { loadFiches } from '../src/loaders/fiches.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const boardPath = join(repoRoot, 'diagrams', 'avancement', 'board.html');
const planPath = join(repoRoot, 'features', 'PLAN.md');

const block = buildPlanDeltaBlock(readFileSync(planPath, 'utf8'), loadFiches(repoRoot));
const before = readFileSync(boardPath, 'utf8');
const after = upsertPlanDeltaBlock(before, block);

if (after === before) {
  console.log('regen-plan-delta: board.html déjà à jour.');
} else {
  writeFileSync(boardPath, after);
  console.log('regen-plan-delta: bloc écart-plan régénéré depuis PLAN.md + backlog.');
}
