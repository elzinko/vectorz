import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * avancement-data — le board d'avancement compilé (fiche 20260823124042842, lot 0).
 * Deux filets : la logique de tri/compte/groupe sur des fiches synthétiques, plus un
 * invariant sur le backlog RÉEL (le board se construit sans erreur et reste cohérent).
 */
import { describe, expect, it } from 'vitest';
import { STATUTS, buildAvancementData } from '../core/avancement-data.js';
import type { Fiche } from '../loaders/fiches.js';
import { loadFiches } from '../loaders/fiches.js';

const F = (over: Partial<Fiche>): Fiche => ({
  id: '0001',
  title: 'X',
  type: 'feature',
  priority: 'P2',
  status: 'idea',
  ready: false,
  milestone: '',
  product: 'mega-city',
  pr: '',
  labels: [],
  blocked: '',
  done: false,
  file: 'features/0001-x.md',
  ...over,
});

describe('STATUTS — colonne du flux (sliver B, fiche 652)', () => {
  it('contient les deux terminaux de provenance `merged` et `split`', () => {
    expect(STATUTS).toContain('merged');
    expect(STATUTS).toContain('split');
  });

  it('ne contient plus `blocked` — devenu un drapeau orthogonal, pas une colonne', () => {
    expect(STATUTS).not.toContain('blocked');
  });
});

describe('buildAvancementData — drapeau `blocked` par-dessus la colonne (sliver B, fiche 652)', () => {
  it('une fiche ready ET blocked reste dans la colonne ready, avec le drapeau exposé', () => {
    const data = buildAvancementData([
      F({ id: '0102', status: 'ready', ready: true, blocked: 'ADR-030 non ratifié' }),
    ]);
    const f = data.actives.find((a) => a.id === '0102');
    expect(f?.status).toBe('ready');
    expect(f?.blocked).toBe('ADR-030 non ratifié');
  });

  it('une fiche non bloquée expose un drapeau vide', () => {
    const data = buildAvancementData([F({ id: '0001', status: 'ready', ready: true })]);
    expect(data.actives[0]?.blocked).toBe('');
  });
});

describe('buildAvancementData — logique du board', () => {
  it('exclut du board actif les statuts terminaux gardés dans features/ (superseded/merged/split)', () => {
    const data = buildAvancementData([
      F({ id: '0001', status: 'ready', ready: true, priority: 'P0' }),
      F({ id: '0002', status: 'superseded', priority: 'P1' }),
      F({ id: '0003', status: 'merged', priority: 'P1' }),
      F({ id: '0004', status: 'split', priority: 'P1' }),
    ]);
    expect(data.actives.map((f) => f.id)).toEqual(['0001']);
    expect(data.counts.superseded).toBe(1); // toujours compté dans le tableau global des statuts
  });

  it('compte par statut, trie les actives par priorité puis id, exclut done', () => {
    const data = buildAvancementData([
      F({ id: '0003', priority: 'P3' }),
      F({ id: '0001', priority: 'P0' }),
      F({ id: '0002', priority: 'P0' }),
      F({ id: '0008', status: 'shipped', done: true }),
    ]);
    expect(data.counts).toEqual({ idea: 3, shipped: 1 });
    // actives = non-done ; triées P0(0001,0002) puis P3(0003)
    expect(data.actives.map((f) => f.id)).toEqual(['0001', '0002', '0003']);
  });

  it('compte les tirables (status ready ; un terminal ready ne compte pas)', () => {
    const data = buildAvancementData([
      F({ id: '0001', status: 'ready', ready: true }),
      F({ id: '0002', status: 'idea', ready: false }),
      F({ id: '0003', status: 'idea', ready: true }), // idea → pas tirable
      F({ id: '0004', status: 'superseded', ready: true }), // terminal → hors board, jamais tirable
    ]);
    expect(data.tirables).toBe(1);
  });

  it('expose des filtres dédupliqués (statuts, priorités, produits)', () => {
    const data = buildAvancementData([
      F({ id: '0001', status: 'ready', priority: 'P0', product: 'mega-city' }),
      F({ id: '0002', status: 'idea', priority: 'P0', product: 'vectorz' }),
    ]);
    expect(data.filtres.priorites).toEqual(['P0']);
    expect(data.filtres.statuts.sort()).toEqual(['idea', 'ready']);
    expect(data.filtres.produits.sort()).toEqual(['mega-city', 'vectorz']);
  });
});

describe('avancement-data — invariant sur le backlog RÉEL', () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

  it('le board se compile sans erreur et reste cohérent avec les fiches', () => {
    const fiches = loadFiches(repoRoot);
    expect(fiches.length).toBeGreaterThan(50); // le backlog existe
    const data = buildAvancementData(fiches);
    // Cohérence : chaque active est bien une fiche non-livrée.
    const activeIds = new Set(data.actives.map((f) => f.id));
    for (const f of fiches) {
      if (f.done) expect(activeIds.has(f.id)).toBe(false);
    }
    // Le compte total = somme des statuts.
    const somme = Object.values(data.counts).reduce((a, b) => a + b, 0);
    expect(somme).toBe(fiches.length);
    // Ids uniques (pas de doublon dans les actives).
    expect(new Set(data.actives.map((f) => f.id)).size).toBe(data.actives.length);
  });

  it('aucune fiche `status: blocked` orpheline (sliver B, fiche 652 : blocked = drapeau, pas colonne)', () => {
    const fiches = loadFiches(repoRoot);
    const orphans = fiches.filter((f) => f.status === 'blocked');
    expect(orphans.map((f) => f.id)).toEqual([]);
  });
});
