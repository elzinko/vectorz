/**
 * La source des étapes fines (fiche 20261110191135802) : le JSON de `ezk process show --json` est
 * vérifié sur l'exemple rangé du contrat ; un format inconnu est refusé net, jamais deviné.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { translateProcessShow } from './ezkProcessShowSource.js';

const EXAMPLE = fileURLToPath(
  new URL('../../../../../../mega-city/contracts/process-show/v1/example.json', import.meta.url),
);
const example = (): Record<string, unknown> => JSON.parse(readFileSync(EXAMPLE, 'utf8'));

describe('translateProcessShow', () => {
  it('lit l’exemple rangé du contrat : les skills, leurs étapes, les réglages et les liens', () => {
    const { skills, liens } = translateProcessShow(example());
    expect(skills.map((s) => s.id)).toEqual([
      'ezk-backlog',
      'ezk-sprint',
      'ezk-retro',
      'ezk-archive',
    ]);
    const revue = skills[1]?.etapes.find((e) => e.id === 'revue-adverse');
    expect(revue).toMatchObject({
      num: 7,
      agents: ['ezk-reviewer'],
      reglages: [{ cle: 'review.adverse', valeur: 'run' }],
    });
    expect(liens).toContainEqual(expect.objectContaining({ de: 'ezk-retro', vers: 'ezk-backlog' }));
  });

  it('refuse un schema_version inconnu, une étape ou un lien mal formés', () => {
    expect(() => translateProcessShow({ ...example(), schema_version: 2 })).toThrow(
      /schema_version 2 inconnu/,
    );
    expect(() =>
      translateProcessShow({
        ...example(),
        skills: [{ id: 'x', nom: 'X', enClair: 'x', etapes: [{ id: 'e' }] }],
      }),
    ).toThrow(/ezk process show --json : champ num absent/);
    expect(() => translateProcessShow({ ...example(), liens: [{ de: 'a' }] })).toThrow(
      /champ vers absent/,
    );
    expect(() => translateProcessShow({ schema_version: 1, skills: 'x' })).toThrow(
      /champ skills mal formé/,
    );
  });

  it('relaie les boucles entre étapes et le drapeau outil (fiche 20261117223348250)', () => {
    const { skills, boucles } = translateProcessShow(example());
    expect(skills.filter((s) => s.outil).map((s) => s.id)).toEqual(['ezk-archive']);
    expect(boucles).toContainEqual({
      de: 'ezk-sprint:gate',
      vers: 'ezk-sprint:code',
      libelle: 'Gate rouge, on reprend le code.',
    });
  });

  it('une méthode d’avant les boucles (champs absents) se lit sans boucle ni outil ; mal formés, ils sont refusés', () => {
    const older = example();
    delete older.boucles;
    for (const s of older.skills as Record<string, unknown>[]) delete s.outil;
    const out = translateProcessShow(older);
    expect(out.boucles).toEqual([]);
    expect(out.skills.some((s) => s.outil)).toBe(false);
    expect(() => translateProcessShow({ ...example(), boucles: [{ de: 'a' }] })).toThrow(/champ vers absent/);
    expect(() =>
      translateProcessShow({
        ...example(),
        skills: [{ id: 'x', nom: 'X', enClair: 'x', outil: 'oui', etapes: [] }],
      }),
    ).toThrow(/champ outil mal formé/);
  });
});
