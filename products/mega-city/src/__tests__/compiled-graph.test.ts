/**
 * compiled-graph — l'INSTANCE compilée du graphe (fiche 357, ADR-0040 étape 1).
 *
 * `graph.ts` sait déjà calculer les arêtes et détecter les liens cassés (rapport,
 * non-bloquant). Ce qui manquait : UN objet typé — nœuds + arêtes — qu'on peut
 * émettre tel quel, et qui ÉCHOUE (lève) si une arête pointe vers un id inconnu
 * (D5 : « un id référencé inexistant fait échouer le validateur »).
 */
import { describe, expect, it } from 'vitest';
import {
  type CompiledGraph,
  type CompiledNode,
  compileGraph,
  isRelation,
  queryGraph,
  resolveNode,
} from '../core/compiled-graph.js';
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

const skill = (id: string): CompiledNode => ({ kind: 'skill', id });
const agent = (id: string): CompiledNode => ({ kind: 'agent', id });
const rule = (id: string): CompiledNode => ({ kind: 'rule', id });

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
    expect(queryGraph(graph, 'composes', skill('a'))).toEqual(['b']);
  });

  it('par verbe, sens direct : `reviewer` compose `b` (via le champ competences)', () => {
    expect(queryGraph(graph, 'compose', agent('reviewer'))).toEqual(['b']);
  });

  it('par verbe, sens inverse : qui applique la règle ? (skill ET agent, triés)', () => {
    expect(queryGraph(graph, 'applique', rule('clean/x'), true)).toEqual(['a', 'reviewer']);
  });

  it('« est-vérifié-par » ne se confond pas avec « applique » : seul l\'agent vérifie', () => {
    expect(queryGraph(graph, 'est-verifie-par', rule('clean/x'))).toEqual(['reviewer']);
    expect(queryGraph(graph, 'est-verifie-par', rule('clean/x'), true)).toEqual([]);
  });

  it('un artefact périmé (arêtes sans `verb`) répond quand même par verbe', () => {
    const stale = {
      nodes: graph.nodes,
      edges: graph.edges.map(({ verb: _verb, ...rest }) => rest),
    } as unknown as CompiledGraph;

    expect(queryGraph(stale, 'applique', rule('clean/x'), true)).toEqual(['a', 'reviewer']);
  });

  it('isRelation reconnaît les liens ET les verbes, refuse le reste (une faute de frappe ne passe pas)', () => {
    expect(isRelation('applies')).toBe(true);
    expect(isRelation('est-verifie-par')).toBe(true);
    expect(isRelation('applique')).toBe(true);
    expect(isRelation('appliques')).toBe(false);
    expect(isRelation('')).toBe(false);
  });
});

describe("resolveNode — un id n'est pas une identité : le kind en fait partie (retour Codex)", () => {
  // Comme `ezk-archive` dans le vrai catalogue : un skill ET un agent portent le même nom.
  // Le skill `twin` compose `b` ; l'agent `twin` compose (competences) `c`.
  const twins: CompiledGraph = compileGraph(
    catalogOf({
      skills: index<Skill>([
        { id: 'twin', content: '', composes: ['b'] },
        { id: 'b', content: '' },
        { id: 'c', content: '' },
      ]),
      agents: index<Agent>([{ id: 'twin', role: '', competences: ['c'], interactions: [] }]),
    }),
  );

  it("REFUSE un id partagé quand le VERBE ne dit pas lequel : jamais une réponse mélangée", () => {
    expect(resolveNode(twins, 'compose', 'twin')).toEqual({
      status: 'ambiguous',
      kinds: ['agent', 'skill'],
    });
  });

  it('le LIEN tranche quand un seul des deux peut en être la source : composes → skill, competences → agent', () => {
    const viaSkill = resolveNode(twins, 'composes', 'twin');
    const viaAgent = resolveNode(twins, 'competences', 'twin');

    expect(viaSkill).toEqual({ status: 'found', node: skill('twin') });
    expect(viaAgent).toEqual({ status: 'found', node: agent('twin') });
  });

  it('sens inverse : c\'est le kind d\'ARRIVÉE du lien qui tranche', () => {
    // Qui compose le skill `twin` ? `composes` arrive sur un skill.
    expect(resolveNode(twins, 'composes', 'twin', true)).toEqual({
      status: 'found',
      node: skill('twin'),
    });
    // « roles » arrive sur un agent.
    expect(resolveNode(twins, 'roles', 'twin', true)).toEqual({
      status: 'found',
      node: agent('twin'),
    });
  });

  it('`kind:id` désigne exactement ce nœud, et chaque nœud ne répond que pour LUI', () => {
    const asSkill = resolveNode(twins, 'compose', 'skill:twin');
    const asAgent = resolveNode(twins, 'compose', 'agent:twin');

    expect(asSkill).toEqual({ status: 'found', node: skill('twin') });
    expect(asAgent).toEqual({ status: 'found', node: agent('twin') });
    expect(queryGraph(twins, 'compose', skill('twin'))).toEqual(['b']);
    expect(queryGraph(twins, 'compose', agent('twin'))).toEqual(['c']);
  });

  it('un id qui n\'existe pas, ou pas sous ce kind, est inconnu (faute de frappe ≠ « aucune arête »)', () => {
    expect(resolveNode(twins, 'compose', 'ghost')).toEqual({ status: 'unknown' });
    expect(resolveNode(twins, 'compose', 'rule:twin')).toEqual({ status: 'unknown' });
    // Un préfixe qui n'est pas un kind reste dans l'id : il n'est pas avalé en silence.
    expect(resolveNode(twins, 'compose', 'skil:twin')).toEqual({ status: 'unknown' });
  });

  it("un id unique répond sans kind, même si le lien ne peut pas partir de lui (réponse vide, comme avant)", () => {
    expect(resolveNode(twins, 'composes', 'b')).toEqual({ status: 'found', node: skill('b') });
    expect(queryGraph(twins, 'competences', skill('b'))).toEqual([]);
  });
});
