import { describe, expect, it } from 'vitest';
import { type NowState, suggestNow } from '../core/now.js';

const state = (over: Partial<NowState> = {}): NowState => ({
  sprintOpenIds: [],
  headReady: null,
  blockedAhead: [],
  ...over,
});

describe('suggestNow — boussole de session (fiche 20261010091118580)', () => {
  it('rend 1 à 3 suites, jamais plus', () => {
    for (const s of [
      state({ sprintOpenIds: ['111'] }),
      state({ headReady: '222' }),
      state({ blockedAhead: ['333'] }),
      state(),
    ]) {
      const out = suggestNow(s);
      expect(out.length).toBeGreaterThanOrEqual(1);
      expect(out.length).toBeLessThanOrEqual(3);
    }
  });

  it('un sprint ouvert prime : finir le lot avant d’en ouvrir un autre', () => {
    const out = suggestNow(state({ sprintOpenIds: ['111', '222'], headReady: '999' }));
    expect(out[0]).toEqual({
      kind: 'suite',
      command: '/ezk-sprint',
      reason: 'un sprint est ouvert (2 storys non livrées) — construis le lot, puis close',
    });
  });

  it('sinon, une fiche prête → la développer, avec next en piste', () => {
    const out = suggestNow(state({ headReady: '20261008154805639' }));
    expect(out[0].command).toBe('/ezk-sprint run');
    expect(out[0].reason).toContain('20261008154805639');
    expect(out.some((s) => s.kind === 'piste' && s.command.includes('next'))).toBe(true);
  });

  it('sinon, une tête à groomer → groom de CETTE tête', () => {
    const out = suggestNow(state({ blockedAhead: ['444', '555'] }));
    expect(out).toEqual([
      {
        kind: 'suite',
        command: '/ezk-backlog groom 444',
        reason: 'la tête du plan n’est pas prête — groome-la pour la rendre tirable',
      },
    ]);
  });

  it('rien de tirable → revoir le stock / clore l’itération', () => {
    const out = suggestNow(state());
    expect(out[0].command).toBe('/ezk-backlog list');
    expect(out.some((s) => s.command === '/ezk-retro run')).toBe(true);
  });
});
