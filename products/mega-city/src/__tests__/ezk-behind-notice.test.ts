/**
 * `behindNotice` (fiche 20261003201034897) — le message « le code d'ezk est en retard », pur.
 * Le comptage git (sans fetch) est fait au bord ; ici on prouve le message et son silence.
 */
import { describe, expect, it } from 'vitest';
import { behindNotice, lagWarningSilenced } from '../core/ezk-cli.js';

describe('behindNotice (fiche 20261003201034897)', () => {
  it('à jour (0) → aucun message', () => {
    expect(behindNotice(0, '/r')).toBeNull();
  });

  it('en retard de 1 commit → phrase + commande git pull --ff-only', () => {
    const m = behindNotice(1, '/home/x/vectorz');
    expect(m).toContain('1 commit');
    expect(m).toContain('git -C /home/x/vectorz pull --ff-only');
    expect(m).toContain('origin/main');
  });

  it('en retard de plusieurs → pluriel', () => {
    expect(behindNotice(3, '/r')).toContain('3 commits');
  });

  it('valeurs non significatives → silence (jamais de faux signal)', () => {
    expect(behindNotice(-1, '/r')).toBeNull();
    expect(behindNotice(Number.NaN, '/r')).toBeNull();
  });
});

describe('lagWarningSilenced (fiche 20261101131505997)', () => {
  it('EZK_NO_LAG_WARNING=1 coupe l’avertissement', () => {
    expect(lagWarningSilenced({ EZK_NO_LAG_WARNING: '1' })).toBe(true);
  });

  it('sans la variable, ou avec une autre valeur, l’avertissement reste', () => {
    expect(lagWarningSilenced({})).toBe(false);
    expect(lagWarningSilenced({ EZK_NO_LAG_WARNING: '0' })).toBe(false);
    expect(lagWarningSilenced({ EZK_NO_LAG_WARNING: '' })).toBe(false);
  });
});
