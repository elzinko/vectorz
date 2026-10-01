/**
 * Les outils dans le graphe compilé : un 6ᵉ type de nœud `tool`, un lien `uses` (skill → outil),
 * un verbe `utilise` (fiche 20260917123943914, ADR-0058).
 */
import { describe, expect, it } from 'vitest';
import { compileGraph, queryGraph } from '../core/compiled-graph.js';
import { graphEdges, validateGraph } from '../core/graph.js';
import type { Tool } from '../core/tools.js';
import type { Agent, Bundle, Profile, Rule, Skill } from '../domain/model.js';
import type { Catalog } from '../loaders/catalog.js';

const index = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((x) => [x.id, x]));

function catalogOf(skills: Skill[], tools?: Tool[]): Catalog {
  return {
    rules: index<Rule>([]),
    agents: index<Agent>([]),
    skills: index<Skill>(skills),
    bundles: index<Bundle>([]),
    profiles: index<Profile>([]),
    ...(tools ? { tools: index(tools) } : {}),
  };
}

const skill = (id: string): Skill => ({ id, content: '' });
const tool = (id: string, over: Partial<Tool> = {}): Tool => ({
  id,
  usedBy: [],
  commands: [],
  ...over,
});

describe('nœuds `tool` et liens `uses`', () => {
  it('un skill qui cite un outil donne une arête skill → outil, verbe « utilise »', () => {
    const catalog = catalogOf([skill('ezk-backlog')], [tool('bin/regen-backlog.sh', { usedBy: ['ezk-backlog'] })]);

    expect(graphEdges(catalog)).toContainEqual({
      from: 'ezk-backlog',
      fromKind: 'skill',
      link: 'uses',
      verb: 'utilise',
      to: 'bin/regen-backlog.sh',
      toKind: 'tool',
    });
  });

  it('le graphe compilé porte les outils comme des nœuds, triés avec les autres', () => {
    const catalog = catalogOf([skill('a')], [tool('bin/z.sh', { usedBy: ['a'] }), tool('bin/b.sh')]);

    const { nodes } = compileGraph(catalog);

    expect(nodes.filter((n) => n.kind === 'tool')).toEqual([
      { kind: 'tool', id: 'bin/b.sh' },
      { kind: 'tool', id: 'bin/z.sh' },
    ]);
  });

  it('sans outils dans le catalogue, aucun nœud `tool` et aucun lien `uses`', () => {
    const catalog = catalogOf([skill('a')]);

    expect(compileGraph(catalog).nodes.some((n) => n.kind === 'tool')).toBe(false);
    expect(graphEdges(catalog).some((e) => e.link === 'uses')).toBe(false);
    expect(validateGraph(catalog).nodeCount.tool).toBe(0);
  });

  it('on interroge les outils comme le reste : quels outils ce skill utilise, qui utilise cet outil', () => {
    const catalog = catalogOf(
      [skill('a'), skill('b')],
      [tool('bin/x.sh', { usedBy: ['a', 'b'] }), tool('bin/y.sh', { usedBy: ['a'] })],
    );
    const graph = compileGraph(catalog);

    expect(queryGraph(graph, 'utilise', { kind: 'skill', id: 'a' })).toEqual(['bin/x.sh', 'bin/y.sh']);
    expect(queryGraph(graph, 'uses', { kind: 'tool', id: 'bin/x.sh' }, true)).toEqual(['a', 'b']);
  });

});

describe('outils orphelins — signalés, jamais masqués', () => {
  const orphansOf = (tools: Tool[]): string[] =>
    validateGraph(catalogOf([skill('a')], tools)).orphans.filter((o) => o.kind === 'tool').map((o) => o.id);

  it('un outil que rien ne justifie est orphelin', () => {
    expect(orphansOf([tool('bin/seul.sh')])).toEqual(['bin/seul.sh']);
  });

  it('un skill qui le cite le justifie', () => {
    expect(orphansOf([tool('bin/x.sh', { usedBy: ['a'] })])).toEqual([]);
  });

  it('une commande du manifeste le justifie : on le lance à la main', () => {
    expect(orphansOf([tool('bin/ezk-map.ts', { commands: ['ezk dashboard'] })])).toEqual([]);
  });

  it('une raison « internal » du manifeste le justifie', () => {
    expect(orphansOf([tool('bin/ezk.ts', { internal: 'le routeur lui-même' })])).toEqual([]);
  });

  it('les orphelins sortent triés, et comptés dans nodeCount', () => {
    const report = validateGraph(catalogOf([skill('a')], [tool('bin/z.sh'), tool('bin/a.sh')]));

    expect(report.orphans.filter((o) => o.kind === 'tool').map((o) => o.id)).toEqual(['bin/a.sh', 'bin/z.sh']);
    expect(report.nodeCount.tool).toBe(2);
  });
});
