import { describe, expect, it } from 'vitest';
import { FORGE_EXIT, decideForgeState } from '../forge.js';

describe('decideForgeState — le guichet forge (ADR-0061, fiche 20261013074251752)', () => {
  it('config coupée (pr: false) → off, sans jamais regarder gh', () => {
    expect(decideForgeState(false, true)).toBe('off');
    expect(decideForgeState(false, false)).toBe('off');
  });

  it('config allumée mais gh absent/non authentifié → unavailable', () => {
    expect(decideForgeState(true, false)).toBe('unavailable');
  });

  it('config allumée et gh prêt → ok', () => {
    expect(decideForgeState(true, true)).toBe('ok');
  });

  it('la config prime : off ne dépend jamais de gh (jamais confondu avec unavailable)', () => {
    // Un projet coupé reste `off` quelle que soit la présence de gh.
    expect(decideForgeState(false, true)).not.toBe('unavailable');
    expect(decideForgeState(false, false)).not.toBe('unavailable');
  });

  it('codes de sortie fixes : ok et off en 0 (réponse rendue), unavailable en 3', () => {
    expect(FORGE_EXIT.ok).toBe(0);
    expect(FORGE_EXIT.off).toBe(0);
    expect(FORGE_EXIT.unavailable).toBe(3);
  });
});
