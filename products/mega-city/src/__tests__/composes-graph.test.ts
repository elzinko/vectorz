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
  renderComposesGraphMermaid,
} from '../core/composes-graph.js';
import type { Skill } from '../domain/model.js';
import { type Catalog, loadCatalog } from '../loaders/catalog.js';

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

function catalogOfSkills(skills: Skill[]): Catalog {
  return {
    rules: new Map(),
    agents: new Map(),
    skills: new Map(skills.map((s) => [s.id, s])),
    bundles: new Map(),
    profiles: new Map(),
  };
}

describe('graphe de composition — les deux tiers (fiche 20260812104022246)', () => {
  it('dessine composes: en trait plein et delegates: en pointillé', () => {
    const graph = renderComposesGraphMermaid(
      catalogOfSkills([
        { id: 'a', content: '', composes: ['b'], delegates: ['c'] },
        { id: 'b', content: '' },
        { id: 'c', content: '' },
      ]),
    );
    expect(graph).toBe(['flowchart LR', '    a --> b', '    a -.-> c'].join('\n'));
  });

  it('une cible à la fois composée et déléguée reste en trait plein (le requis gagne)', () => {
    const graph = renderComposesGraphMermaid(
      catalogOfSkills([
        { id: 'a', content: '', composes: ['b'], delegates: ['b'] },
        { id: 'b', content: '' },
      ]),
    );
    expect(graph).toBe(['flowchart LR', '    a --> b'].join('\n'));
  });
});

describe('skills/README.md — bloc composes-graph à jour (ADR-0025, fiche 0149)', () => {
  it('le bloc régénéré en mémoire est identique au bloc présent sur disque', () => {
    const catalog = loadCatalog(repoRoot);
    const expected = buildComposesGraphBlock(catalog);
    const actual = extractManagedBlock(readFileSync(readmePath, 'utf8'));
    expect(actual).toBe(expected);
  });
});
