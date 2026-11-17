/**
 * `--validation` de `ezk pr emit-local` (fiche 20261117155515200) : une option répétée garde chaque
 * valeur, dans l'ordre ; une seule option garde sa forme à virgules.
 */
import { describe, expect, it } from 'vitest';
import { parseValidationSpecs } from '../validation-args.js';

describe('parseValidationSpecs', () => {
  it('rien passé → undefined (le défaut du rendu joue)', () => {
    expect(parseValidationSpecs([])).toBeUndefined();
  });

  it('une seule option : la forme à virgules donne une ligne par paire, comme avant', () => {
    expect(parseValidationSpecs(['Gate=✅, Revue=⏳'])).toEqual({
      ok: true,
      rows: [
        { modalite: 'Gate', statut: '✅' },
        { modalite: 'Revue', statut: '⏳' },
      ],
    });
  });

  it("option répétée : chaque valeur est une ligne, dans l'ordre, et une virgule ne coupe plus le statut", () => {
    expect(parseValidationSpecs(['Gate=✅ 2417 tests, 48 suites', 'Revue=✅ GO'])).toEqual({
      ok: true,
      rows: [
        { modalite: 'Gate', statut: '✅ 2417 tests, 48 suites' },
        { modalite: 'Revue', statut: '✅ GO' },
      ],
    });
  });

  it('une paire sans « = » est refusée, avec la paire fautive', () => {
    expect(parseValidationSpecs(['Gate'])).toEqual({ ok: false, pair: 'Gate' });
    expect(parseValidationSpecs(['A=✅', 'B'])).toEqual({ ok: false, pair: 'B' });
  });
});
