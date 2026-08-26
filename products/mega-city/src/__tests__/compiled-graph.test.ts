/**
 * compiled-graph — l'INSTANCE compilée du graphe (fiche 357, ADR-0040 étape 1).
 *
 * `graph.ts` sait déjà calculer les arêtes et détecter les liens cassés (rapport,
 * non-bloquant). Ce qui manquait : UN objet typé — nœuds + arêtes — qu'on peut
 * émettre tel quel, et qui ÉCHOUE (lève) si une arête pointe vers un id inconnu
 * (D5 : « un id référencé inexistant fait échouer le validateur »).
 */
import { describe, expect, it } from 'vitest';
import { compileGraph } from '../core/compiled-graph.js';
import type { Agent, Bundle, Profile, Rule, Skill } from '../domain/model.js';
import type { Catalog } from '../loaders/catalog.js';

const index = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((x) => [x.id, x]));

function catalogOf(parts: Partial<Catalog>): Catalog {
  return {
    rules: index<Rule>([]),
    agents: index<Agent>([]),
    skills: index<Skill>([]),
    bundles: index<Bundle>([]),
    profiles: index<Profile>([]),
    ...parts,
  };
}

describe('compileGraph — instance typée', () => {
  it('émet un nœud par entité de chaque catalogue, avec son kind', () => {
    const catalog = catalogOf({
      skills: index<Skill>([{ id: 'a', content: '' }]),
      agents: index<Agent>([{ id: 'reviewer', role: '', competences: [], interactions: [] }]),
    });

    const compiled = compileGraph(catalog);

    expect(compiled.nodes).toContainEqual({ kind: 'skill', id: 'a' });
    expect(compiled.nodes).toContainEqual({ kind: 'agent', id: 'reviewer' });
  });

  it('émet les arêtes déclarées en frontmatter, telles quelles (aucun rename de clé)', () => {
    const catalog = catalogOf({
      skills: index<Skill>([
        { id: 'a', content: '', composes: ['b'] },
        { id: 'b', content: '' },
      ]),
    });

    const compiled = compileGraph(catalog);

    expect(compiled.edges).toContainEqual({
      from: 'a',
      fromKind: 'skill',
      link: 'composes',
      to: 'b',
      toKind: 'skill',
    });
  });

  it('échoue quand une arête référence un id inconnu (pas de lien pendouillant silencieux)', () => {
    const catalog = catalogOf({
      skills: index<Skill>([{ id: 'a', content: '', composes: ['ghost'] }]),
    });

    expect(() => compileGraph(catalog)).toThrow(/ghost/);
  });

  it('un id référencé qui existe bien ne lève rien', () => {
    const catalog = catalogOf({
      skills: index<Skill>([
        { id: 'a', content: '', composes: ['b'] },
        { id: 'b', content: '' },
      ]),
    });

    expect(() => compileGraph(catalog)).not.toThrow();
  });
});
