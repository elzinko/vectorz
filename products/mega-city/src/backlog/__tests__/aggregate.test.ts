import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import { aggregateByScript, selectScope } from '../aggregate.js';

/** Fiche minimale pour les tests — seuls les champs utilisés par aggregate.ts sont réels. */
function fiche(overrides: Partial<Fiche> & { id: string }): Fiche {
  return {
    title: `Fiche${overrides.id} titre par défaut`, // 1er mot distinct — évite un cluster title-prefix parasite
    type: 'feature',
    priority: 'P1',
    status: 'ready',
    ready: true,
    epic: '',
    milestone: '',
    product: 'mega-city',
    pr: '',
    labels: [],
    blocked: '',
    done: false,
    file: `features/${overrides.id}-x.md`,
    ...overrides,
  };
}

describe('aggregateByScript', () => {
  it('1. deux fiches partageant un label → un cluster reason:"label"', () => {
    const report = aggregateByScript([
      fiche({ id: '1', labels: ['bmad'] }),
      fiche({ id: '2', labels: ['bmad'] }),
    ]);
    expect(report.clusters).toHaveLength(1);
    expect(report.clusters[0]).toEqual({ key: 'bmad', reason: 'label', ficheIds: ['1', '2'] });
  });

  it('2. fiche multi-labels → apparaît dans chaque cluster de label', () => {
    const report = aggregateByScript([
      fiche({ id: '1', labels: ['bmad', 'lisibilite'] }),
      fiche({ id: '2', labels: ['bmad'] }),
      fiche({ id: '3', labels: ['lisibilite'] }),
    ]);
    const bmad = report.clusters.find((c) => c.key === 'bmad');
    const lisibilite = report.clusters.find((c) => c.key === 'lisibilite');
    expect(bmad?.ficheIds).toEqual(['1', '2']);
    expect(lisibilite?.ficheIds).toEqual(['1', '3']);
  });

  it('3. fiches sans tag → pas de crash, couverture correcte', () => {
    const report = aggregateByScript([
      fiche({ id: '1', labels: [], title: 'Alpha unique' }),
      fiche({ id: '2', labels: [], title: 'Beta unique' }),
    ]);
    expect(report.coverage).toEqual({ total: 2, tagged: 0, clustered: 0 });
    expect(report.singletons).toEqual(['1', '2']);
  });

  it('5. title-prefix : même 1er token → cluster, sinon singleton', () => {
    const report = aggregateByScript([
      fiche({ id: '1', title: 'Aggregate — backlog rationalisation' }),
      fiche({ id: '2', title: 'Aggregate — moteur script' }),
      fiche({ id: '3', title: 'Autre sujet sans lien' }),
    ]);
    const prefixCluster = report.clusters.find((c) => c.reason === 'title-prefix');
    expect(prefixCluster?.ficheIds).toEqual(['1', '2']);
    expect(report.singletons).toEqual(['3']);
  });

  it('6. déterminisme : entrée mélangée → sortie identique', () => {
    const a = [
      fiche({ id: '3', labels: ['x'] }),
      fiche({ id: '1', labels: ['x'] }),
      fiche({ id: '2', epic: '5', title: 'Z' }),
      fiche({ id: '4', epic: '5', title: 'Y' }),
    ];
    const b = [a[3], a[1], a[2], a[0]];
    expect(aggregateByScript(a)).toEqual(aggregateByScript(b));
  });

  it('7. selectScope filtre par produit et priorité', () => {
    const fiches = [
      fiche({ id: '1', product: 'mega-city', priority: 'P1' }),
      fiche({ id: '2', product: 'vectorz', priority: 'P2' }),
      fiche({ id: '3', product: 'mega-city', priority: 'P2' }),
    ];
    expect(selectScope(fiches, 'all').map((f) => f.id)).toEqual(['1', '2', '3']);
    expect(selectScope(fiches, 'mega-city').map((f) => f.id)).toEqual(['1', '3']);
    expect(selectScope(fiches, 'P1').map((f) => f.id)).toEqual(['1']);
  });

  it('8. dégénéré : 0 fiche / tout done → rapport vide, pas d\'exception', () => {
    expect(aggregateByScript([])).toEqual({
      scope: 'all',
      coverage: { total: 0, tagged: 0, clustered: 0 },
      clusters: [],
      singletons: [],
    });
    const allDone = aggregateByScript([fiche({ id: '1', done: true, labels: ['x'] })]);
    expect(allDone.coverage).toEqual({ total: 0, tagged: 0, clustered: 0 });
  });

  it('9. aucun cluster de taille 1', () => {
    const report = aggregateByScript([
      fiche({ id: '1', labels: ['solo'] }),
      fiche({ id: '2', title: 'Sujet totalement isolé' }),
    ]);
    expect(report.clusters.every((c) => c.ficheIds.length >= 2)).toBe(true);
  });

});
