#!/usr/bin/env tsx
/**
 * regen-avancement — régénère le bloc de données géré du board d'avancement
 * (`diagrams/avancement/board.html`) depuis le backlog réel.
 *
 *   pnpm --dir products/mega-city avancement:regen
 *
 * Le cœur (avancement-data.ts) compile les données, PUR et déterministe ; ce script
 * est le bord I/O — il lit/écrit le HTML du board, rien de plus (même patron que
 * `regen-map-data.ts` pour la carte interactive : le board ne peut dessiner QUE ce
 * qui existe dans les fiches, fiche 20260823124042842 lot 0).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAvancementDataBlock, upsertAvancementDataBlock } from '../src/core/avancement-data.js';
import { loadFiches } from '../src/loaders/fiches.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const boardPath = join(repoRoot, 'diagrams', 'avancement', 'board.html');

const block = buildAvancementDataBlock(loadFiches(repoRoot));
const before = readFileSync(boardPath, 'utf8');
const after = upsertAvancementDataBlock(before, block);

if (after === before) {
  console.log('regen-avancement: board.html déjà à jour.');
} else {
  writeFileSync(boardPath, after);
  console.log('regen-avancement: board.html régénéré depuis le backlog.');
}
