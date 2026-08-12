#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
/**
 * regen-composes-graph — régénère le bloc managé Mermaid du graphe `composes:`
 * dans `skills/README.md` (ADR-0025 §5, fiche 0149).
 *
 *   pnpm --dir products/mega-city composes:graph
 *
 * Le cœur (composes-graph.ts) calcule le bloc, PUR et déterministe ; ce script
 * est le bord I/O — il lit/écrit `skills/README.md`, rien de plus. Le LLM ne
 * range jamais ce bloc à la main (fiche 0149 §3).
 */
import { fileURLToPath } from 'node:url';
import { buildComposesGraphBlock, upsertManagedBlock } from '../src/core/composes-graph.js';
import { loadCatalog } from '../src/loaders/catalog.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = join(repoRoot, 'skills', 'README.md');

const catalog = loadCatalog(repoRoot);
const block = buildComposesGraphBlock(catalog);
const before = readFileSync(readmePath, 'utf8');
const after = upsertManagedBlock(before, block);

if (after === before) {
  console.log('regen-composes-graph: skills/README.md déjà à jour.');
} else {
  writeFileSync(readmePath, after);
  console.log('regen-composes-graph: skills/README.md régénéré.');
}
