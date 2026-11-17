/**
 * Projection du contrat `graph check` en carte zoomable (fiche 20261117114544792) : pure, testée sur
 * le contrat réel publié par la méthode, et sur un graphe à l'échelle du réel pour caler les seuils.
 */
import { describe, expect, it } from 'vitest';
import type { GraphCheck, GraphKind } from './graphCheck.js';
import { GRAPH_ZOOM_THRESHOLDS, graphLevelForZoom, graphNodeId, projectGraphToFlow } from './graphProjection.js';
import { fitZoom } from './semanticZoom.js';
import { graphCheckExample } from './testing/graphCheckExample.js';

const contract = graphCheckExample();
const ids = (nodes: { id: string }[]): string[] => nodes.map((n) => n.id);

describe('projectGraphToFlow — niveau 1 : les 7 familles et leurs liens comptés', () => {
  const { nodes, edges } = projectGraphToFlow(contract, 1);

  it('une boîte par famille, même vide, avec son libellé français et son compte', () => {
    expect(ids(nodes)).toEqual([
      'famille:profile',
      'famille:bundle',
      'famille:skill',
      'famille:agent',
      'famille:rule',
      'famille:tool',
      'famille:command',
    ]);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n.data]));
    expect(byId['famille:skill']).toMatchObject({ label: 'Compétences', count: 1 });
    expect(byId['famille:agent']).toMatchObject({ label: 'Agents', count: 0 });
    expect(byId['famille:command']).toMatchObject({ label: 'Commandes', count: 2 });
  });

  it('une arête par (famille source, verbe, famille cible), libellée du verbe et de son compte', () => {
    expect(edges.map((e) => [e.source, e.target, e.label]).sort()).toEqual(
      [
        ['famille:skill', 'famille:rule', 'applique · 1'],
        ['famille:command', 'famille:tool', 'lance · 1'],
        ['famille:skill', 'famille:command', 'utilise · 1'],
      ].sort(),
    );
  });

  it('les liens d’une famille vers elle-même sont comptés dans sa boîte, pas dessinés en boucle', () => {
    const graph: GraphCheck = {
      ...contract,
      edges: [
        { from: 'a', fromKind: 'skill', link: 'composes', verb: 'compose', to: 'b', toKind: 'skill' },
        { from: 'b', fromKind: 'skill', link: 'composes', verb: 'compose', to: 'c', toKind: 'skill' },
      ],
    };
    const { nodes: n, edges: e } = projectGraphToFlow(graph, 1);
    expect(e).toEqual([]);
    expect(n.find((x) => x.id === 'famille:skill')?.data.internal).toEqual([{ verb: 'compose', count: 2 }]);
  });
});

describe('projectGraphToFlow — niveau 2 : chaque brique dans la boîte de sa famille', () => {
  const { nodes, edges } = projectGraphToFlow(contract, 2);
  const bricks = nodes.filter((n) => n.type === 'brique');

  it('une brique par nœud du contrat, enfant de sa famille, ids préfixés par la sorte', () => {
    expect(ids(bricks).sort()).toEqual(
      [
        'command:ezk forge integrate',
        'command:ezk help',
        'rule:clean-code/no-dead-code',
        'skill:ezk-sprint',
        'tool:bin/forge-integrate.ts',
      ].sort(),
    );
    expect(bricks.find((b) => b.id === 'rule:clean-code/no-dead-code')?.parentId).toBe('famille:rule');
  });

  it('pas d’arête sans sélection', () => {
    expect(edges).toEqual([]);
  });

  it('les positions sont identiques à tous les niveaux : changer de niveau ne déplace rien', () => {
    const at = (level: 1 | 2 | 3) =>
      projectGraphToFlow(contract, level).nodes.map((n) => [n.id, n.position, n.width, n.height]);
    const level2 = at(2);
    expect(at(3)).toEqual(level2);
    const families = projectGraphToFlow(contract, 1).nodes.map((n) => [n.id, n.position, n.width, n.height]);
    expect(level2.filter(([id]) => String(id).startsWith('famille:'))).toEqual(families);
  });

  it('chaque brique tient dans sa famille, sans chevauchement', () => {
    const family = (id: string) => nodes.find((n) => n.id === id)!;
    const siblings = bricks.filter((b) => b.parentId === 'famille:command');
    expect(siblings).toHaveLength(2);
    const [a, b] = siblings as [(typeof bricks)[0], (typeof bricks)[0]];
    expect(a.position).not.toEqual(b.position);
    for (const brick of bricks) {
      const parent = family(brick.parentId!);
      expect(brick.position.x + brick.width).toBeLessThanOrEqual(parent.width);
      expect(brick.position.y + brick.height).toBeLessThanOrEqual(parent.height);
    }
  });
});

describe('projectGraphToFlow — niveau 3 : le fichier et les liens comptés par verbe', () => {
  const { nodes } = projectGraphToFlow(contract, 3);
  const data = (id: string) => nodes.find((n) => n.id === id)?.data;

  it('une brique montre son fichier et ses liens, sortants et entrants', () => {
    expect(data('skill:ezk-sprint')).toMatchObject({
      level: 3,
      fichier: 'skills/ezk-sprint/SKILL.md',
      liens: [
        { sens: 'sortant', verb: 'applique', count: 1 },
        { sens: 'sortant', verb: 'utilise', count: 1 },
      ],
    });
    expect(data('command:ezk forge integrate')).toMatchObject({
      liens: [
        { sens: 'sortant', verb: 'lance', count: 1 },
        { sens: 'entrant', verb: 'utilise', count: 1 },
      ],
    });
  });

  it('aux niveaux 1 et 2, la brique ne porte pas le détail', () => {
    const level2 = projectGraphToFlow(contract, 2).nodes.find((n) => n.id === 'skill:ezk-sprint');
    expect(level2?.data.fichier).toBeUndefined();
    expect(level2?.data.liens).toBeUndefined();
  });
});

describe('projectGraphToFlow — sélection : la brique, ses voisins directs, le reste estompé', () => {
  const selected = graphNodeId('command', 'ezk forge integrate');
  const { nodes, edges } = projectGraphToFlow(contract, 2, selected);
  const brick = (id: string) => nodes.find((n) => n.id === id)!;

  it('marque la brique, ses voisins des deux sens, et estompe les autres briques', () => {
    expect(brick(selected).data).toMatchObject({ highlight: 'self' });
    expect(brick('skill:ezk-sprint').data).toMatchObject({ highlight: 'neighbor' });
    expect(brick('tool:bin/forge-integrate.ts').data).toMatchObject({ highlight: 'neighbor' });
    expect(brick('rule:clean-code/no-dead-code').data).toMatchObject({ dim: true });
    expect(brick('command:ezk help').data).toMatchObject({ dim: true });
    expect(brick('skill:ezk-sprint').data.dim).toBeUndefined();
  });

  it('dessine les liens de la brique sélectionnée, libellés du verbe', () => {
    expect(edges.map((e) => [e.source, e.target, e.label]).sort()).toEqual(
      [
        ['skill:ezk-sprint', selected, 'utilise'],
        [selected, 'tool:bin/forge-integrate.ts', 'lance'],
      ].sort(),
    );
  });

  it('sans sélection, personne n’est estompé ; une sélection inconnue ne change rien', () => {
    const plain = projectGraphToFlow(contract, 2).nodes;
    expect(plain.some((n) => n.data.dim)).toBe(false);
    expect(projectGraphToFlow(contract, 2, 'rule:inconnue').nodes).toEqual(plain);
  });

  it('les boîtes de famille ne sont jamais estompées', () => {
    expect(nodes.filter((n) => n.type === 'famille').some((n) => n.data.dim)).toBe(false);
  });
});

describe('seuils du niveau, à l’échelle du réel (337 briques)', () => {
  const COUNTS: Record<GraphKind, number> = { rule: 96, agent: 8, skill: 26, bundle: 11, profile: 6, tool: 115, command: 75 };
  const real: GraphCheck = {
    nodes: (Object.keys(COUNTS) as GraphKind[]).flatMap((kind) =>
      Array.from({ length: COUNTS[kind] }, (_, i) => ({ kind, id: `${kind}-${i}` })),
    ),
    edges: [],
    nodeCount: COUNTS,
    edgeCount: 0,
  };
  const { nodes } = projectGraphToFlow(real, 2);
  const families = nodes.filter((n) => n.type === 'famille');

  it('cadrée en entier dans une fenêtre de 1000 × 520, la carte s’affiche sous le seuil du niveau 2', () => {
    const fit = fitZoom(families, { width: 1000, height: 520 });
    expect(fit).toBeGreaterThan(0.1);
    expect(fit).toBeLessThan(GRAPH_ZOOM_THRESHOLDS[0]);
    expect(graphLevelForZoom(fit)).toBe(1);
  });

  it('aucune brique ne sort de sa famille, même à 115 briques', () => {
    for (const brick of nodes.filter((n) => n.type === 'brique')) {
      const parent = nodes.find((n) => n.id === brick.parentId)!;
      expect(brick.position.x + brick.width).toBeLessThanOrEqual(parent.width);
      expect(brick.position.y + brick.height).toBeLessThanOrEqual(parent.height);
    }
  });

  it('les boîtes de famille ne se chevauchent pas', () => {
    for (const a of families)
      for (const b of families) {
        if (a.id >= b.id) continue;
        const apart =
          a.position.x + a.width <= b.position.x ||
          b.position.x + b.width <= a.position.x ||
          a.position.y + a.height <= b.position.y ||
          b.position.y + b.height <= a.position.y;
        expect(apart, `${a.id} / ${b.id}`).toBe(true);
      }
  });
});

describe('graphLevelForZoom', () => {
  it('suit les seuils de la carte, avec l’hystérésis partagée', () => {
    const [low] = GRAPH_ZOOM_THRESHOLDS;
    expect(graphLevelForZoom(low * 0.5)).toBe(1);
    expect(graphLevelForZoom(low * 1.05, 1)).toBe(1);
    expect(graphLevelForZoom(low * 1.15, 1)).toBe(2);
  });
});
