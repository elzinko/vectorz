/**
 * Sœur « tuyau/plan » du board (endpoint `/api/board`) : le cœur pur `shapeProject` met un plan
 * calculé à la forme d'un `BoardProject`, avec des `runs` vides (l'adaptateur des runs n'est pas
 * encore branché) et des métriques non câblées en placeholders honnêtes.
 */
import { describe, expect, it } from 'vitest';
import type { PlanData } from './backlogReader.js';
import { shapeProject } from './boardProvider.js';

const plan: PlanData = {
  funnel: { idea: 3, ready: 2, wip: 1, unversioned: 1, parked: 4 },
  versions: {
    current: { ver: 'v0.2.0', name: 'v0.2.0', done: 0, wip: 1, ready: 2, idea: 1, total: 4 },
    upcoming: [{ ver: 'v0.3.0', name: 'v0.3.0', done: 0, wip: 0, ready: 1, idea: 0, total: 1 }],
    past: [{ ver: 'v0.1.0', name: 'v0.1.0', done: 3, wip: 0, ready: 0, idea: 0, total: 3, date: 'taguée' }],
  },
  done: 42,
};

describe('shapeProject — met le plan à la forme BoardProject', () => {
  it('passe funnel et versions tels quels et reporte le compte livré dans metrics.done', () => {
    const p = shapeProject('vectorz', 'le projet', plan);
    expect(p.name).toBe('vectorz');
    expect(p.desc).toBe('le projet');
    expect(p.funnel).toEqual(plan.funnel);
    expect(p.versions).toEqual(plan.versions);
    expect(p.metrics.done).toBe(42);
  });

  it('laisse les runs VIDES (pas de faux run) et met des placeholders honnêtes, pas de faux zéro déguisé', () => {
    const p = shapeProject('vectorz', '', plan);
    expect(p.runs).toEqual({}); // l'adaptateur des runs n'est pas branché
    expect(p.live).toBe(false);
    expect(p.metrics.tokens).toBe('—');
    expect(p.metrics.temps).toBe('—');
    expect(p.metrics.perFiche).toBe('—');
    // Les compteurs non câblés sont '—', jamais un faux 0 (constat de revue #1).
    expect(p.metrics.sprints).toBe('—');
    expect(p.metrics.runs).toBe('—');
    expect(p.metrics.retros).toBe('—');
  });
});
