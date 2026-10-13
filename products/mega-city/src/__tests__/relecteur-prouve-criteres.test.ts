/**
 * Test de contrat sur le TEXTE (fiche 20261003075821760) — le relecteur prouve les critères.
 * Garde les consignes contre une dérive silencieuse : si quelqu'un retire la règle « le relecteur
 * prouve, le constructeur ne coche pas », ce test tombe.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const MEGA_CITY = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const reviewer = readFileSync(join(MEGA_CITY, 'agents', 'ezk-reviewer.md'), 'utf8');
const sprint = readFileSync(join(MEGA_CITY, 'skills', 'ezk-sprint', 'SKILL.md'), 'utf8');

describe('le relecteur prouve les critères (fiche 20261003075821760)', () => {
  it('la consigne du relecteur décrit le jugement critère par critère, avec preuve', () => {
    expect(reviewer).toMatch(/[Cc]ritères d'acceptation/);
    expect(reviewer).toContain('prouvé');
    expect(reviewer).toContain('non prouvé');
  });

  it('la consigne du relecteur interdit un GO tant qu’un critère n’est pas prouvé', () => {
    expect(reviewer).toMatch(/[Pp]as de GO|aucun GO/);
  });

  it('le relecteur porte le format « une ligne par critère »', () => {
    expect(reviewer).toMatch(/critère \d+ : prouvé —/);
    expect(reviewer).toMatch(/critère \d+ : non prouvé —/);
  });

  it('ezk-sprint dit que les cases viennent du verdict, jamais du constructeur', () => {
    expect(sprint).toContain('20261003075821760');
    expect(sprint).toMatch(/jamais le constructeur|jamais cochées par le constructeur|ne coche jamais ses propres critères/);
    expect(sprint).toMatch(/PROUVE|PROUVÉ/);
  });

  it('le checkpoint (étape 9) présente la liste des critères prouvés au PO', () => {
    expect(sprint).toMatch(/critères d'acceptation PROUVÉS|liste des critères/);
  });
});
