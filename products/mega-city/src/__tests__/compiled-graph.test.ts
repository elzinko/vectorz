/**
 * compiled-graph — l'INSTANCE compilée du graphe (fiche 357, ADR-0040 étape 1).
 *
 * `graph.ts` sait déjà calculer les arêtes et détecter les liens cassés (rapport,
 * non-bloquant). Ce qui manquait : UN objet typé — nœuds + arêtes — qu'on peut
 * émettre tel quel, et qui ÉCHOUE (lève) si une arête pointe vers un id inconnu
 * (D5 : « un id référencé inexistant fait échouer le validateur »).
 */
import { describe, expect, it } from 'vitest';
import { type CompiledGraph, compileGraph, isRelation, queryGraph } from '../core/compiled-graph.js';
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
      verb: 'compose',
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

describe('queryGraph — interroger l\'objet compilé sans grep (fiche 357)', () => {
  // Deux skills (`a` applique la règle, `b` est composé par `a`), un agent qui applique
  // aussi la règle et qui la vérifie : de quoi distinguer « applique » de « est-vérifié-par ».
  const graph: CompiledGraph = compileGraph(
    catalogOf({
      skills: index<Skill>([
        { id: 'a', content: '', composes: ['b'], applies: ['clean/x'] },
        { id: 'b', content: '' },
      ]),
      agents: index<Agent>([
        { id: 'reviewer', role: '', competences: ['b'], interactions: ['clean/x'] },
      ]),
      rules: index<Rule>([
        {
          id: 'clean/x',
          kind: 'disposition',
          level: 'MUST',
          content: '',
          enforcements: [{ type: 'agent-check', agent: 'reviewer' }],
        },
      ]),
    }),
  );

  it('par lien, sens direct : ce que `a` compose', () => {
    expect(queryGraph(graph, 'composes', 'a')).toEqual(['b']);
  });

  it('par verbe, sens direct : `reviewer` compose `b` (via le champ competences)', () => {
    expect(queryGraph(graph, 'compose', 'reviewer')).toEqual(['b']);
  });

  it('par verbe, sens inverse : qui applique la règle ? (skill ET agent, triés)', () => {
    expect(queryGraph(graph, 'applique', 'clean/x', true)).toEqual(['a', 'reviewer']);
  });

  it('« est-vérifié-par » ne se confond pas avec « applique » : seul l\'agent vérifie', () => {
    expect(queryGraph(graph, 'est-verifie-par', 'clean/x')).toEqual(['reviewer']);
    expect(queryGraph(graph, 'est-verifie-par', 'clean/x', true)).toEqual([]);
  });

  it('un artefact périmé (arêtes sans `verb`) répond quand même par verbe', () => {
    const stale = {
      nodes: graph.nodes,
      edges: graph.edges.map(({ verb: _verb, ...rest }) => rest),
    } as unknown as CompiledGraph;

    expect(queryGraph(stale, 'applique', 'clean/x', true)).toEqual(['a', 'reviewer']);
  });

  it('isRelation reconnaît les liens ET les verbes, refuse le reste (une faute de frappe ne passe pas)', () => {
    expect(isRelation('applies')).toBe(true);
    expect(isRelation('est-verifie-par')).toBe(true);
    expect(isRelation('applique')).toBe(true);
    expect(isRelation('appliques')).toBe(false);
    expect(isRelation('')).toBe(false);
  });
});
