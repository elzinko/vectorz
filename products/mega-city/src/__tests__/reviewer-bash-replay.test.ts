/**
 * Test de contrat sur le TEXTE (fiche 20261002230039755) — la revue rejoue les scripts bash
 * modifiés sur trois entrées hostiles, et en porte la trace dans son verdict.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const reviewer = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'agents', 'ezk-reviewer.md'),
  'utf8',
);

describe('la revue rejoue les scripts bash modifiés (fiche 20261002230039755)', () => {
  it('la consigne décrit le rejeu des scripts bash modifiés', () => {
    expect(reviewer).toMatch(/[Rr]ejeu des scripts bash/);
    expect(reviewer).toContain('20261002230039755');
  });

  it('elle nomme les trois entrées hostiles', () => {
    expect(reviewer).toMatch(/valeur absente/);
    expect(reviewer).toMatch(/tube coupé/);
    expect(reviewer).toMatch(/git.*en échec|commande `git` en échec/);
  });

  it('le verdict porte la trace du rejeu (section de la sortie)', () => {
    expect(reviewer).toMatch(/Rejeu scripts bash/);
  });
});
