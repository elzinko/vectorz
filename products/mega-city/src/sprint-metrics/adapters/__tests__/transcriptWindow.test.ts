/**
 * `fileOutsideWindow` (fiche 20261013143324505, AC « scan borné à la fenêtre ») : décide si un transcript
 * peut être SAUTÉ sans risque. Invariant : on ne saute JAMAIS un fichier qui pourrait porter un évènement
 * dans la fenêtre — seulement ceux entièrement avant (mtime < début) ou entièrement après (1er > fin).
 */
import { describe, expect, it } from 'vitest';
import { fileOutsideWindow } from '../transcriptSource.js';

const WIN = { startTs: '2026-10-07T00:00:00Z', endTs: '2026-10-07T23:59:59Z' };
const ms = (iso: string): number => Date.parse(iso);

describe('fileOutsideWindow — saut sûr des transcripts hors fenêtre', () => {
  it('fichier entièrement AVANT la fenêtre (mtime < début) → sauté', () => {
    expect(fileOutsideWindow('2026-10-05T10:00:00Z', ms('2026-10-05T12:00:00Z'), WIN)).toBe(true);
  });

  it('fichier entièrement APRÈS la fenêtre (1er évènement > fin) → sauté', () => {
    expect(fileOutsideWindow('2026-10-20T09:00:00Z', ms('2026-10-24T18:00:00Z'), WIN)).toBe(true);
  });

  it('fichier qui CHEVAUCHE la fenêtre → gardé (jamais sauté)', () => {
    // 1er évènement avant la fin ET modifié pendant/après le début : peut porter un évènement en fenêtre.
    expect(fileOutsideWindow('2026-10-07T08:00:00Z', ms('2026-10-07T20:00:00Z'), WIN)).toBe(false);
  });

  it('1er horodatage inconnu + mtime dans la fenêtre → gardé (on ne devine pas)', () => {
    expect(fileOutsideWindow(undefined, ms('2026-10-07T12:00:00Z'), WIN)).toBe(false);
  });
});
