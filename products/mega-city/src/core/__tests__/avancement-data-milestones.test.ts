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
    ready: false,
    epic: '',
    milestone: '',
    product: 'mega-city',
    pr: '',
    labels: [],
    blocked: '',
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
