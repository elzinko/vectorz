import { describe, expect, it } from 'vitest';
import { computeSprintWindow } from '../domain/duration.js';

describe('computeSprintWindow', () => {
  it('window = [checkpoint précédent, checkpoint du sprint] quand un checkpoint antérieur existe', () => {
    const checkpoints = [
      { ts: '2026-08-30T09:00:00.000Z', slug: 'un' },
      { ts: '2026-08-30T11:30:00.000Z', slug: 'deux' },
    ];
    const window = computeSprintWindow(checkpoints, 'deux');
    expect(window).toEqual({
      startTs: '2026-08-30T09:00:00.000Z',
      endTs: '2026-08-30T11:30:00.000Z',
      durationMs: 2.5 * 60 * 60 * 1000,
    });
  });

  it('replie sur fallbackStartTs (ex. run.started) quand le sprint est le premier de la session', () => {
    const checkpoints = [{ ts: '2026-08-30T11:00:00.000Z', slug: 'un' }];
    const window = computeSprintWindow(checkpoints, 'un', '2026-08-30T08:00:00.000Z');
    expect(window).toEqual({
      startTs: '2026-08-30T08:00:00.000Z',
      endTs: '2026-08-30T11:00:00.000Z',
      durationMs: 3 * 60 * 60 * 1000,
    });
  });

  it('retourne null si aucun checkpoint ne porte ce slug', () => {
    expect(computeSprintWindow([{ ts: '2026-08-30T11:00:00.000Z', slug: 'autre' }], 'un')).toBeNull();
  });

  it('trie les checkpoints par ts avant de chercher le précédent (ordre d’arrivée non garanti)', () => {
    const checkpoints = [
      { ts: '2026-08-30T11:30:00.000Z', slug: 'deux' },
      { ts: '2026-08-30T09:00:00.000Z', slug: 'un' },
    ];
    const window = computeSprintWindow(checkpoints, 'deux');
    expect(window?.startTs).toBe('2026-08-30T09:00:00.000Z');
  });
});
