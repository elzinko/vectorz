/**
 * La source des recettes (fiche 20261104090518109) : le JSON de `ezk recipes --json` est vérifié, un
 * format inconnu est refusé net, jamais deviné.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { translateRecipes } from './ezkRecipesSource.js';

const EXAMPLE = fileURLToPath(
  new URL('../../../../../../mega-city/contracts/recipes/v1/example.json', import.meta.url),
);
const example = (): Record<string, unknown> => JSON.parse(readFileSync(EXAMPLE, 'utf8'));

describe('translateRecipes', () => {
  it('lit l’exemple rangé du contrat : le catalogue, le projet, et l’implémentation de chaque recette', () => {
    const { catalogue, projet } = translateRecipes(example());
    expect(catalogue.map((r) => r.id)).toEqual(['20260830104013705', '20261001004228784']);
    expect(catalogue[0]).toMatchObject({ complete: false, missing: ['source', 'status'] });
    expect(catalogue[1]).toMatchObject({ source: 'tools/launcher', complete: true });
    expect(projet).toEqual([expect.objectContaining({ id: '20261018110931402', dir: 'apps/outil', ici: true })]);
    expect(catalogue.every((r) => r.ici === false)).toBe(true);
  });

  it('refuse un schema_version inconnu ou une recette mal formée', () => {
    expect(() => translateRecipes({ ...example(), schema_version: 2 })).toThrow(/schema_version 2 inconnu/);
    expect(() => translateRecipes({ ...example(), projet: [{ id: 'x' }] })).toThrow(/ezk recipes --json/);
    expect(() => translateRecipes({ schema_version: 1 })).toThrow(/catalogue ou projet absent/);
  });
});
