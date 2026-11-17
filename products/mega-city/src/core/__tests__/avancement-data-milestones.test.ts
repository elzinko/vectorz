import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import { buildAvancementData } from '../avancement-data.js';

const fiche = (over: Partial<Fiche>): Fiche =>
  ({
    id: '',
    title: '',
    type: 'feature',
    priority: 'P2',
    status: 'idea',
    milestone: '',
    product: 'mega-city',
    pr: '',
    labels: [],
    blocked: '',
    version: '',
    file: '',
    done: false,
    ...over,
  }) as Fiche;

describe('buildAvancementData — cumul par milestone (ADR-0017 A16)', () => {
  it('compte les fiches du jalon par statut et dérive le statut du milestone', () => {
    const { milestones } = buildAvancementData([
      fiche({ id: 'c1', milestone: 'fondation', status: 'shipped', done: true }),
      fiche({ id: 'c2', milestone: 'fondation', status: 'in-progress' }),
      fiche({ id: 'c3', milestone: 'fondation', status: 'idea' }),
    ]);
    expect(milestones).toHaveLength(1);
    expect(milestones[0]?.milestone).toBe('fondation');
    expect(milestones[0]?.total).toBe(3);
    expect(milestones[0]?.shipped).toBe(1);
    expect(milestones[0]?.counts).toEqual({ shipped: 1, 'in-progress': 1, idea: 1 });
    expect(milestones[0]?.status).toBe('in-progress'); // au moins une engagée
    expect(milestones[0]?.children).toEqual(['c2', 'c3']); // actives seulement (non-done)
  });

  it('milestone dont toutes les fiches sont livrées → statut `shipped`', () => {
    const { milestones } = buildAvancementData([
      fiche({ id: 'd1', milestone: 'rationalisation', status: 'shipped', done: true }),
      fiche({ id: 'd2', milestone: 'rationalisation', status: 'shipped', done: true }),
    ]);
    expect(milestones[0]?.status).toBe('shipped');
    expect(milestones[0]?.shipped).toBe(2);
  });

  it('milestone que des `idea` → statut `idea`', () => {
    const { milestones } = buildAvancementData([
      fiche({ id: 'i1', milestone: 'articles', status: 'idea' }),
      fiche({ id: 'i2', milestone: 'articles', status: 'idea' }),
    ]);
    expect(milestones[0]?.status).toBe('idea');
  });

  it('exclut les statuts terminaux (superseded/merged/split) et les fiches sans milestone', () => {
    const { milestones } = buildAvancementData([
      fiche({ id: 's1', milestone: 'fondation', status: 'superseded' }),
      fiche({ id: 's2', milestone: 'fondation', status: 'idea' }),
      fiche({ id: 'n1', milestone: '', status: 'idea' }), // sans milestone → hors cumul
    ]);
    expect(milestones).toHaveLength(1);
    expect(milestones[0]?.total).toBe(1); // seule s2
    expect(milestones[0]?.counts).toEqual({ idea: 1 });
  });

  it('trie les milestones selon MILESTONE_ORDER (fondation → articles → inconnu)', () => {
    const { milestones } = buildAvancementData([
      fiche({ id: 'a', milestone: 'articles', status: 'idea' }),
      fiche({ id: 'b', milestone: 'fondation', status: 'idea' }),
      fiche({ id: 'z', milestone: 'zzz-inconnu', status: 'idea' }),
    ]);
    expect(milestones.map((m) => m.milestone)).toEqual(['fondation', 'articles', 'zzz-inconnu']);
  });
});

// fiche 20261114131612572 — l'objectif publié comme un objet : son nom, ses livrées, leurs versions.
describe('buildAvancementData — l’objectif publié comme un objet', () => {
  it('un objectif entièrement livré garde ses fiches : children vide, livrees pleine, versions distinctes', () => {
    const { milestones } = buildAvancementData([
      fiche({ id: 'f3', milestone: 'fondation', status: 'shipped', done: true, version: 'v0.10.0' }),
      fiche({ id: 'f1', milestone: 'fondation', status: 'shipped', done: true, version: 'v0.2.0' }),
      fiche({ id: 'f2', milestone: 'fondation', status: 'shipped', done: true, version: 'v0.2.0' }),
      fiche({ id: 'f4', milestone: 'fondation', status: 'shipped', done: true, version: '' }),
    ]);
    expect(milestones[0]).toMatchObject({
      status: 'shipped',
      children: [],
      livrees: ['f1', 'f2', 'f3', 'f4'],
      versions: ['v0.2.0', 'v0.10.0'], // ordre des versions, la vide écartée
    });
  });

  it('livrees ne garde que les livrées ; children garde les actives ; une close n’est dans aucune', () => {
    const { milestones } = buildAvancementData([
      fiche({ id: 'l1', milestone: 'board', status: 'shipped', done: true, version: 'v1.0.0' }),
      fiche({ id: 'a1', milestone: 'board', status: 'ready', version: 'v2.0.0' }),
      fiche({ id: 'x1', milestone: 'board', status: 'superseded', done: true, version: 'v3.0.0' }),
    ]);
    expect(milestones[0]).toMatchObject({ livrees: ['l1'], children: ['a1'], versions: ['v1.0.0'] });
    expect(milestones[0]?.livrees).toHaveLength(milestones[0]?.shipped ?? -1);
  });

  it('le nom vient de la déclaration de l’objectif ; sans déclaration il vaut une chaîne vide', () => {
    const { milestones } = buildAvancementData(
      [fiche({ id: 'b1', milestone: 'board' }), fiche({ id: 'p1', milestone: 'parked' })],
      undefined,
      new Map([['board', 'Le board dit vrai']]),
    );
    expect(Object.fromEntries(milestones.map((m) => [m.milestone, m.nom]))).toEqual({
      board: 'Le board dit vrai',
      parked: '',
    });
  });
});
