/**
 * recipe-graph — les recettes entrent dans le graphe (fiche 20261117140305053, ADR-0090).
 *
 * En clair : chaque `recipes/<nom>.md` est une brique `recipe` ; ses `composes:` sont des liens
 * `compose` vers une autre recette ou une règle ; une recette sans lien est orpheline (info).
 */
import { describe, expect, it } from 'vitest';
import { graphEdges, validateGraph } from '../core/graph.js';
import { deriveRecipes } from '../core/recipe-graph.js';
import type { Catalog } from '../loaders/catalog.js';

const doc = (composes: string): string => `---\nid: "1"\ncomposes: ${composes}\n---\n# corps\n`;

function catalogWith(files: { id: string; text: string }[]): Catalog {
  return {
    rules: new Map([
      ['dns/ionos', { id: 'dns/ionos', kind: 'disposition', level: 'MUST', content: '' }],
    ]),
    agents: new Map(),
    skills: new Map(),
    bundles: new Map(),
    profiles: new Map(),
    recipes: new Map(deriveRecipes(files).map((r) => [r.id, r])),
  };
}

describe('deriveRecipes', () => {
  it('lit les composes du front-matter, triés par id', () => {
    const recipes = deriveRecipes([
      { id: 'b', text: doc('[a, dns/ionos]') },
      { id: 'a', text: doc('[]') },
    ]);
    expect(recipes).toEqual([
      { id: 'a', composes: [] },
      { id: 'b', composes: ['a', 'dns/ionos'] },
    ]);
  });

  it('sans front-matter lisible ou sans composes : aucune composition, jamais une exception', () => {
    const recipes = deriveRecipes([
      { id: 'x', text: 'pas de front-matter' },
      { id: 'y', text: '---\n: : [\n---\n' },
      { id: 'z', text: '---\nid: "1"\n---\n' },
    ]);
    expect(recipes.map((r) => r.composes)).toEqual([[], [], []]);
  });
});

describe('recettes dans le graphe', () => {
  it('un composes vers une recette donne un lien compose recette → recette', () => {
    const catalog = catalogWith([
      { id: 'a', text: doc('[b]') },
      { id: 'b', text: doc('[]') },
    ]);
    expect(graphEdges(catalog)).toContainEqual({
      from: 'a',
      fromKind: 'recipe',
      link: 'recipe-composes',
      verb: 'compose',
      to: 'b',
      toKind: 'recipe',
    });
  });

  it('un composes vers une règle existante donne un lien compose recette → règle, sans lien cassé', () => {
    const catalog = catalogWith([{ id: 'a', text: doc('[dns/ionos]') }]);
    expect(graphEdges(catalog)).toContainEqual({
      from: 'a',
      fromKind: 'recipe',
      link: 'recipe-rule',
      verb: 'compose',
      to: 'dns/ionos',
      toKind: 'rule',
    });
    expect(validateGraph(catalog).broken).toEqual([]);
  });

  it('une cible inconnue est un lien cassé, comme pour un skill', () => {
    const catalog = catalogWith([{ id: 'a', text: doc('[fantome]') }]);
    expect(validateGraph(catalog).broken.map((e) => e.to)).toEqual(['fantome']);
  });

  it('les recettes sont comptées', () => {
    const catalog = catalogWith([
      { id: 'a', text: doc('[]') },
      { id: 'b', text: doc('[]') },
    ]);
    expect(validateGraph(catalog).nodeCount.recipe).toBe(2);
  });

  it('une recette sans aucun lien est orpheline ; une recette qui en compose une autre ne l’est pas', () => {
    const catalog = catalogWith([
      { id: 'seule', text: doc('[]') },
      { id: 'chapeau', text: doc('[cible]') },
      { id: 'cible', text: doc('[]') },
    ]);
    const orphans = validateGraph(catalog)
      .orphans.filter((o) => o.kind === 'recipe')
      .map((o) => o.id);
    expect(orphans).toEqual(['seule']);
  });
});
