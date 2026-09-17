#!/usr/bin/env tsx
/**
 * regen-pilotage — régénère le bloc de données de la page « Pilotage »
 * (`diagrams/pilotage/pilotage.html`) depuis le backlog + les récits `docs/sessions/`.
 *
 *   pnpm --dir products/mega-city pilotage:regen
 *
 * Le cœur (pilotage-data.ts) COMPOSE avancement + runs, PUR ; ce script est le bord I/O.
 * Un test d'invariant rougit si le HTML committé diverge du regen.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPilotageDataBlock, upsertPilotageDataBlock } from '../src/core/pilotage-data.js';
import { loadFiches } from '../src/loaders/fiches.js';
import { loadRuns } from '../src/loaders/runs.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const viewPath = join(repoRoot, 'diagrams', 'pilotage', 'pilotage.html');

const block = buildPilotageDataBlock(loadFiches(repoRoot), loadRuns(repoRoot));
const before = readFileSync(viewPath, 'utf8');
const after = upsertPilotageDataBlock(before, block);

if (after === before) {
  console.log('regen-pilotage: pilotage.html déjà à jour.');
} else {
  writeFileSync(viewPath, after);
  console.log('regen-pilotage: pilotage.html régénéré (milestones + runs).');
}
