/**
 * Fiche 20261126170000114 — `ezk recipes add <id>` : le cœur PUR. On décide, sans toucher au disque,
 * quel fichier écrire dans le projet, ou pourquoi on n'écrit rien.
 */
import { describe, expect, it } from 'vitest';
import { RECIPE_ADD_DIR, planRecipeAdd } from '../recipe-add.js';
import { type ScanEntry, declaredRecipe } from '../recipe-contract.js';
import { discover, recipesContract } from '../recipe-discovery.js';

const md = (id: string, over: Record<string, string> = {}): string => {
  const fields = { id: `"${id}"`, title: `Recette ${id}`, makes: `fabrique ${id}`, source: 'tools/outil', status: 'ready', ...over };
  return `---\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n`;
};
const method = (id: string, file: string, over: Record<string, string> = {}): ScanEntry => ({
  dir: `recipes/${file}.md`,
  recipeMd: md(id, over),
});
const contractOf = (methodRecipes: ScanEntry[], projectRecipes: ScanEntry[] = []) =>
  recipesContract({ methodRecipes: discover(methodRecipes), projectRecipes: discover(projectRecipes) });

describe('planRecipeAdd', () => {
  it('prévoit une déclaration que le contrat des recettes relit, rangée dans le dossier du projet', () => {
    const plan = planRecipeAdd('1', contractOf([method('1', 'lanceur-dev')]));
    expect(plan).toMatchObject({ ok: true, relPath: `${RECIPE_ADD_DIR}/lanceur-dev/RECIPE.md` });
    if (!plan.ok) throw new Error('attendu : ok');
    expect(declaredRecipe(plan.content)).toEqual({
      declared: true,
      recipe: { id: '1', title: 'Recette 1', makes: 'fabrique 1', source: 'tools/outil', status: 'ready' },
    });
    expect(plan.content).toContain('recipes/lanceur-dev.md');
  });

  it('garde intacts un titre ou un makes qui portent des deux-points et des guillemets', () => {
    const entry: ScanEntry = {
      dir: 'recipes/x.md',
      recipeMd: '---\nid: "9"\ntitle: "Un titre: avec \\"guillemets\\""\nmakes: "a: b"\nsource: s\nstatus: ready\n---\n',
    };
    const plan = planRecipeAdd('9', contractOf([entry]));
    if (!plan.ok) throw new Error('attendu : ok');
    expect(declaredRecipe(plan.content)).toMatchObject({
      declared: true,
      recipe: { title: 'Un titre: avec "guillemets"', makes: 'a: b' },
    });
  });

  it('refuse une recette inconnue', () => {
    expect(planRecipeAdd('404', contractOf([method('1', 'a')]))).toEqual({
      ok: false,
      message: expect.stringContaining('inconnue'),
    });
  });

  it('refuse une recette en brouillon (statut draft)', () => {
    const plan = planRecipeAdd('1', contractOf([method('1', 'a', { status: 'draft' })]));
    expect(plan).toEqual({ ok: false, message: expect.stringContaining('brouillon') });
  });

  it('refuse une recette incomplète et nomme ce qui manque', () => {
    const incomplete: ScanEntry = { dir: 'recipes/a.md', recipeMd: '---\nid: "1"\ntitle: T\nstatus: ready\n---\n' };
    const plan = planRecipeAdd('1', contractOf([incomplete]));
    expect(plan).toEqual({ ok: false, message: expect.stringMatching(/brouillon.*makes.*source/s) });
  });

  it('refuse une recette déjà déclarée par le projet', () => {
    const declared: ScanEntry = { dir: 'apps/outil', recipeMd: md('1') };
    const plan = planRecipeAdd('1', contractOf([method('1', 'a')], [declared]));
    expect(plan).toEqual({ ok: false, message: expect.stringContaining('déjà ajoutée') });
  });

  it('refuse une recette dont l’implémentation de référence est déjà dans le projet', () => {
    const contract = contractOf([method('1', 'a')]);
    contract.catalogue[0].ici = true;
    expect(planRecipeAdd('1', contract)).toEqual({ ok: false, message: expect.stringContaining('déjà ajoutée') });
  });

  it('refuse si le dossier visé est déjà pris par une autre déclaration', () => {
    const taken: ScanEntry = { dir: `${RECIPE_ADD_DIR}/a`, recipeMd: md('2') };
    const plan = planRecipeAdd('1', contractOf([method('1', 'a')], [taken]));
    expect(plan).toEqual({ ok: false, message: expect.stringContaining(`${RECIPE_ADD_DIR}/a`) });
  });
});

describe('une recette ajoutée est marquée ici dans le catalogue', () => {
  it('le catalogue marque ici=true une recette que le projet déclare sous le même id', () => {
    const json = contractOf([method('1', 'a'), method('2', 'b')], [{ dir: 'x/y', recipeMd: md('1') }]);
    expect(json.catalogue.map((r) => [r.id, r.ici])).toEqual([
      ['1', true],
      ['2', false],
    ]);
  });
});
