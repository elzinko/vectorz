import { describe, expect, it } from 'vitest';
import { buildAvancementData } from '../avancement-data.js';
import type { Fiche } from '../../loaders/fiches.js';

const fiche = (over: Partial<Fiche>): Fiche =>
  ({
    id: '',
    title: '',
    type: 'feature',
    priority: 'P2',
    status: 'todo',
    ready: false,
    epic: '',
    product: 'mega-city',
    pr: '',
    labels: [],
    file: '',
    done: false,
    ...over,
  }) as Fiche;

describe('buildAvancementData — cumul des épics (D4, fiche 20260825123700998)', () => {
  it('compte les enfants par statut (actifs + livrés) et dérive le statut de l’épic', () => {
    const fiches = [
      fiche({ id: 'E1', type: 'epic', status: 'todo' }),
      fiche({ id: 'c1', epic: 'E1', status: 'shipped', done: true }),
      fiche({ id: 'c2', epic: 'E1', status: 'in-progress' }),
      fiche({ id: 'c3', epic: 'E1', status: 'todo' }),
    ];
    const { epics } = buildAvancementData(fiches);
    expect(epics).toHaveLength(1);
    expect(epics[0]?.childCounts).toEqual({ shipped: 1, 'in-progress': 1, todo: 1 });
    expect(epics[0]?.status).toBe('in-progress'); // au moins un enfant actif
    expect(epics[0]?.children).toEqual(['c2', 'c3']); // enfants ACTIFS seulement
  });

  it('épic dont tous les enfants sont livrés → statut dérivé `shipped`', () => {
    const fiches = [
      fiche({ id: 'E2', type: 'epic', status: 'todo' }),
      fiche({ id: 'd1', epic: 'E2', status: 'shipped', done: true }),
      fiche({ id: 'd2', epic: 'E2', status: 'shipped', done: true }),
    ];
    const { epics } = buildAvancementData(fiches);
    expect(epics[0]?.childCounts).toEqual({ shipped: 2 });
    expect(epics[0]?.status).toBe('shipped');
  });

  it('épic sans enfant → garde le statut saisi (fallback)', () => {
    const { epics } = buildAvancementData([fiche({ id: 'E3', type: 'epic', status: 'todo' })]);
    expect(epics[0]?.childCounts).toEqual({});
    expect(epics[0]?.status).toBe('todo');
  });

  it('épic dont tous les enfants sont en idea → statut dérivé `idea` (pas in-progress)', () => {
    const { epics } = buildAvancementData([
      fiche({ id: 'E4', type: 'epic', status: 'todo' }),
      fiche({ id: 'i1', epic: 'E4', status: 'idea' }),
      fiche({ id: 'i2', epic: 'E4', status: 'idea' }),
    ]);
    expect(epics[0]?.childCounts).toEqual({ idea: 2 });
    expect(epics[0]?.status).toBe('idea');
  });

  it('« tout livré » s’appuie sur done/ même si le statut de provenance n’est pas "shipped"', () => {
    const { epics } = buildAvancementData([
      fiche({ id: 'E5', type: 'epic', status: 'todo' }),
      fiche({ id: 'm1', epic: 'E5', status: 'merged', done: true }),
      fiche({ id: 'm2', epic: 'E5', status: 'split', done: true }),
    ]);
    expect(epics[0]?.status).toBe('shipped');
  });
});
