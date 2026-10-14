/**
 * Test de contrat sur le TEXTE (fiche 20261010235329987) — la revue porte la lentille
 * « déclaration vs comportement » : un livrable qui touche les étiquettes de règles d'un agent
 * (`interactions:` / `applies:` / le graphe) doit dire s'il change le prompt runtime ou seulement
 * la déclaration auditable ; sur-promettre un effet runtime via ces champs est un NO-GO.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const reviewer = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'agents', 'ezk-reviewer.md'),
  'utf8',
);

describe('lentille « déclaration vs comportement » du relecteur (fiche 20261010235329987)', () => {
  it('la lentille est portée par le relecteur, tracée à sa fiche', () => {
    expect(reviewer).toMatch(/[Dd]éclaration vs comportement/);
    expect(reviewer).toContain('20261010235329987');
  });

  it('elle nomme les étiquettes concernées (interactions:/applies:/graphe)', () => {
    expect(reviewer).toMatch(/interactions:/);
    expect(reviewer).toMatch(/applies:/);
    expect(reviewer).toMatch(/graph/);
  });

  it('elle oppose le prompt runtime à la déclaration auditable, et sanctionne la sur-promesse (NO-GO)', () => {
    expect(reviewer).toMatch(/prompt runtime|prompt/);
    expect(reviewer).toMatch(/déclaration auditable|graph:check/);
    expect(reviewer).toMatch(/NO-GO/);
  });
});
