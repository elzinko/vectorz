import { describe, expect, it } from 'vitest';
import { computeSprintWindow } from '../domain/duration.js';

describe('computeSprintWindow', () => {
  it('window = [checkpoint précédent, checkpoint du sprint] quand un checkpoint antérieur existe', () => {
    const checkpoints = [
      { ts: '2026-08-30T09:00:00.000Z', slug: 'un', runId: 'r1' },
      { ts: '2026-08-30T11:30:00.000Z', slug: 'deux', runId: 'r1' },
    ];
    const window = computeSprintWindow(checkpoints, 'deux');
    expect(window).toEqual({
      startTs: '2026-08-30T09:00:00.000Z',
      endTs: '2026-08-30T11:30:00.000Z',
      durationMs: 2.5 * 60 * 60 * 1000,
    });
  });

  it('replie sur fallbackStartTs (ex. run.started) quand le sprint est le premier de la session', () => {
    const checkpoints = [{ ts: '2026-08-30T11:00:00.000Z', slug: 'un', runId: 'r1' }];
    const window = computeSprintWindow(checkpoints, 'un', '2026-08-30T08:00:00.000Z');
    expect(window).toEqual({
      startTs: '2026-08-30T08:00:00.000Z',
      endTs: '2026-08-30T11:00:00.000Z',
      durationMs: 3 * 60 * 60 * 1000,
    });
  });

  it('retourne null seulement quand il n’y a AUCUN checkpoint de sprint', () => {
    expect(computeSprintWindow([], 'un')).toBeNull();
  });

  it('slug absent → date depuis le dernier checkpoint DU RUN COURANT (fiche 20261002230039863)', () => {
    // Le slug du gate diffère de celui de l'objectif (symptôme 2026-10-11) : on ne jette plus, mais on
    // reste DANS le run courant (r2), on n'emprunte pas le checkpoint d'un vieux run (r1).
    const checkpoints = [
      { ts: '2026-08-30T09:00:00.000Z', slug: 'vieux', runId: 'r1' },
      { ts: '2026-08-30T11:30:00.000Z', slug: 'gate-au-slug-different', runId: 'r2' },
    ];
    const window = computeSprintWindow(checkpoints, 'slug-objectif-non-matche', undefined, 'r2');
    expect(window?.endTs).toBe('2026-08-30T11:30:00.000Z');
    expect(window?.startTs).toBe('2026-08-30T09:00:00.000Z');
  });

  it('slug absent ET le run courant n’a aucun checkpoint → null (non daté, jamais un vieux run)', () => {
    const checkpoints = [{ ts: '2026-08-30T09:00:00.000Z', slug: 'vieux', runId: 'r1' }];
    expect(computeSprintWindow(checkpoints, 'slug-objectif', undefined, 'r2-courant-sans-checkpoint')).toBeNull();
  });

  it('un slug qui correspond est préféré, même dans un vieux run (redater un sprint par son slug)', () => {
    const checkpoints = [
      { ts: '2026-08-30T09:00:00.000Z', slug: 'cible', runId: 'r1' },
      { ts: '2026-08-30T11:30:00.000Z', slug: 'plus-recent', runId: 'r2' },
    ];
    const window = computeSprintWindow(checkpoints, 'cible', '2026-08-30T08:00:00.000Z', 'r2');
    expect(window?.endTs).toBe('2026-08-30T09:00:00.000Z');
  });

  it('trie les checkpoints par ts avant de chercher le précédent (ordre d’arrivée non garanti)', () => {
    const checkpoints = [
      { ts: '2026-08-30T11:30:00.000Z', slug: 'deux', runId: 'r1' },
      { ts: '2026-08-30T09:00:00.000Z', slug: 'un', runId: 'r1' },
    ];
    const window = computeSprintWindow(checkpoints, 'deux');
    expect(window?.startTs).toBe('2026-08-30T09:00:00.000Z');
  });
});
