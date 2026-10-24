/**
 * `parseShipDates` (fiche 20261013143324505) : parse la sortie d'UN `git log --diff-filter=A --name-only`
 * sur `features/done/` en { chemin → date du plus ancien ajout }. Remplace 313 `git log` par un seul,
 * en gardant exactement la même sémantique (la plus ANCIENNE date = la date de ship).
 */
import { describe, expect, it } from 'vitest';
import { parseShipDates } from '../repoSource.js';

describe('parseShipDates — un seul git log, date de ship = plus ancien ajout', () => {
  it('associe chaque fiche à la date de son ajout, en gardant la plus ancienne', () => {
    const out = [
      '2026-10-24T10:00:00+02:00', // commit récent (git liste du plus récent au plus ancien)
      '',
      'features/done/aaa.md',
      'features/done/bbb.md',
      '2026-10-20T09:00:00+02:00', // commit plus ancien
      '',
      'features/done/aaa.md', // aaa ré-ajoutée plus tôt → on garde la plus ANCIENNE
      'features/done/ccc.md',
    ].join('\n');
    const m = parseShipDates(out);
    expect(m.get('features/done/aaa.md')).toBe('2026-10-20T09:00:00+02:00'); // plus ancienne
    expect(m.get('features/done/bbb.md')).toBe('2026-10-24T10:00:00+02:00');
    expect(m.get('features/done/ccc.md')).toBe('2026-10-20T09:00:00+02:00');
    expect(m.size).toBe(3);
  });

  it('sortie vide → map vide (dégrade proprement)', () => {
    expect(parseShipDates('').size).toBe(0);
  });
});
