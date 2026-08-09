import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Vérifie que le bloc managé `composes-graph` de `skills/README.md` est à jour
 * (critère 3, ADR-0025 §5) — même filet d'invariant CI que `catalog-readme.test.ts` :
 * régénérer en mémoire depuis le catalogue réel doit produire EXACTEMENT le bloc
 * présent sur disque.
 */
import { describe, expect, it } from 'vitest';
import {
  COMPOSES_GRAPH_BEGIN,
  COMPOSES_GRAPH_END,
  buildComposesGraphBlock,
} from '../core/composes-graph.js';
import { loadCatalog } from '../loaders/catalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..'); // products/mega-city
const readmePath = join(repoRoot, 'skills', 'README.md');

function extractManagedBlock(text: string): string {
  const beginIdx = text.indexOf(COMPOSES_GRAPH_BEGIN);
  const endIdx = text.indexOf(COMPOSES_GRAPH_END);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error(
      'bloc composes-graph absent de skills/README.md — lancer `pnpm composes:graph`',
    );
  }
  return text.slice(beginIdx, endIdx + COMPOSES_GRAPH_END.length);
}

describe('skills/README.md — bloc composes-graph à jour (ADR-0025, fiche 0149)', () => {
  it('le bloc régénéré en mémoire est identique au bloc présent sur disque', () => {
    const catalog = loadCatalog(repoRoot);
    const expected = buildComposesGraphBlock(catalog);
    const actual = extractManagedBlock(readFileSync(readmePath, 'utf8'));
    expect(actual).toBe(expected);
  });
});
