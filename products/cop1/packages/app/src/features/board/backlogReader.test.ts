/**
 * Sœur « plan réel » de board-web (fiche 20261024130842122) : le cœur pur `projectPlan` calcule
 * l'entonnoir, les versions (en cours / à venir / passées, borne ADR-0070) et le compte livré
 * depuis des fiches + les étiquettes git. cop1-local, sans importer mega-city (ADR-021).
 */
import { describe, expect, it } from 'vitest';
import { type PlanFiche, projectPlan } from './backlogReader.js';

const f = (o: Partial<PlanFiche> & { id: string }): PlanFiche => ({
  title: `Fiche ${o.id}`,
  type: 'feature',
  priority: 'P1',
  status: 'idea',
  version: '',
  milestone: '',
  done: false,
  ...o,
});
const noTags = new Set<string>();

describe('projectPlan — l’entonnoir (Funnel)', () => {
  it('compte idea / ready / wip / sans-version / parkées, hors terminales et livrées', () => {
    const plan = projectPlan(
      [
        f({ id: '1', status: 'idea' }),
        f({ id: '2', status: 'ready', version: 'v0.1.0' }),
        f({ id: '3', status: 'in-progress', version: 'v0.1.0' }),
        f({ id: '4', status: 'idea', milestone: 'parked' }), // parkée → hors idea
        f({ id: '5', status: 'shipped', done: true, version: 'v0.1.0' }), // livrée → hors entonnoir
        f({ id: '6', status: 'superseded', version: 'v0.1.0' }), // terminale → hors entonnoir
      ],
      noTags,
    );
    expect(plan.funnel).toEqual({ idea: 1, ready: 1, wip: 1, unversioned: 1, parked: 1 });
    expect(plan.done).toBe(1); // la fiche 5
  });
});

describe('projectPlan — les versions (ADR-0070 : en cours = plus bas lot non tagué)', () => {
  it('range en cours / à venir / passées et compte par état', () => {
    const fiches = [
      f({ id: '10', status: 'shipped', done: true, version: 'v0.1.0' }), // v0.1 taguée
      f({ id: '11', status: 'ready', version: 'v0.2.0' }), // v0.2 en cours (non taguée)
      f({ id: '12', status: 'idea', version: 'v0.2.0' }),
      f({ id: '13', status: 'ready', version: 'v0.3.0' }), // v0.3 à venir
    ];
    const plan = projectPlan(fiches, new Set(['v0.1.0']));
    expect(plan.versions.current?.ver).toBe('v0.2.0');
    expect(plan.versions.current).toMatchObject({ ready: 1, idea: 1, total: 2 });
    expect(plan.versions.upcoming.map((v) => v.ver)).toEqual(['v0.3.0']);
    expect(plan.versions.past.map((v) => v.ver)).toEqual(['v0.1.0']);
    expect(plan.versions.past[0]).toMatchObject({ done: 1, date: 'taguée' });
  });

  it('aucune version → current null, tout vide', () => {
    const plan = projectPlan([f({ id: '1', status: 'idea' })], noTags);
    expect(plan.versions).toEqual({ current: null, upcoming: [], past: [] });
  });
});
