import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * avancement-data — le board d'avancement compilé (fiche 20260823124042842, lot 0).
 * Deux filets : la logique de tri/compte/groupe sur des fiches synthétiques, plus un
 * invariant sur le backlog RÉEL (le board se construit sans erreur et reste cohérent).
 */
import { describe, expect, it } from 'vitest';
import { buildAvancementData } from '../core/avancement-data.js';
import type { Fiche } from '../loaders/fiches.js';
import { loadFiches } from '../loaders/fiches.js';

const F = (over: Partial<Fiche>): Fiche => ({
  id: '0001',
  title: 'X',
  type: 'feature',
  priority: 'P2',
  status: 'idea',
  ready: false,
  epic: '',
  product: 'mega-city',
  pr: '',
  labels: [],
  done: false,
  file: 'features/0001-x.md',
  ...over,
});

describe('buildAvancementData — logique du board', () => {
  it('compte par statut, trie les actives par priorité puis id, exclut done et épics', () => {
    const data = buildAvancementData([
      F({ id: '0003', priority: 'P3' }),
      F({ id: '0001', priority: 'P0' }),
      F({ id: '0002', priority: 'P0' }),
      F({ id: '0009', type: 'epic', priority: '', title: 'Épic' }),
      F({ id: '0008', status: 'shipped', done: true }),
    ]);
    expect(data.counts).toEqual({ idea: 4, shipped: 1 });
    // actives = non-done, non-épic ; triées P0(0001,0002) puis P3(0003)
    expect(data.actives.map((f) => f.id)).toEqual(['0001', '0002', '0003']);
  });

  it('compte les tirables (todo + ready, hors épic)', () => {
    const data = buildAvancementData([
      F({ id: '0001', status: 'ready', ready: true }),
      F({ id: '0002', status: 'idea', ready: false }),
      F({ id: '0003', status: 'idea', ready: true }), // idea → pas tirable
      F({ id: '0004', type: 'epic', status: 'ready', ready: true }), // épic → jamais tirable
    ]);
    expect(data.tirables).toBe(1);
  });

  it('rattache les enfants actifs à leur épic', () => {
    const data = buildAvancementData([
      F({ id: '0010', type: 'epic', title: 'Marketing' }),
      F({ id: '0011', epic: '0010' }),
      F({ id: '0012', epic: '0010' }),
      F({ id: '0013', epic: '0010', done: true }), // livrée → pas dans les enfants actifs
    ]);
    expect(data.epics).toHaveLength(1);
    expect(data.epics[0].children).toEqual(['0011', '0012']);
  });

  it('expose des filtres dédupliqués (statuts, priorités, produits)', () => {
    const data = buildAvancementData([
      F({ id: '0001', status: 'ready', priority: 'P0', product: 'mega-city' }),
      F({ id: '0002', status: 'blocked', priority: 'P0', product: 'vectorz' }),
    ]);
    expect(data.filtres.priorites).toEqual(['P0']);
    expect(data.filtres.statuts.sort()).toEqual(['blocked', 'ready']);
    expect(data.filtres.produits.sort()).toEqual(['mega-city', 'vectorz']);
  });
});

describe('avancement-data — invariant sur le backlog RÉEL', () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

  it('le board se compile sans erreur et reste cohérent avec les fiches', () => {
    const fiches = loadFiches(repoRoot);
    expect(fiches.length).toBeGreaterThan(50); // le backlog existe
    const data = buildAvancementData(fiches);
    // Cohérence : chaque active est bien une fiche non-livrée non-épic.
    const activeIds = new Set(data.actives.map((f) => f.id));
    for (const f of fiches) {
      if (f.done || f.type === 'epic') expect(activeIds.has(f.id)).toBe(false);
    }
    // Le compte total = somme des statuts.
    const somme = Object.values(data.counts).reduce((a, b) => a + b, 0);
    expect(somme).toBe(fiches.length);
    // Ids uniques (pas de doublon dans les actives).
    expect(new Set(data.actives.map((f) => f.id)).size).toBe(data.actives.length);
  });
});
