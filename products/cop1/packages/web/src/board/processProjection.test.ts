/**
 * Projection du contrat `process show` en carte (fiche 20261110185357446) : pure, testée sur le contrat
 * réel publié par la méthode (pas une copie).
 */
import { describe, expect, it } from 'vitest';
import { levelForZoom, projectProcessToFlow, ZOOM_THRESHOLDS } from './processProjection.js';
import { processShowExample } from './testing/processShowExample.js';

const contract = processShowExample();
const ids = (nodes: { id: string }[]): string[] => nodes.map((n) => n.id);

describe('projectProcessToFlow — niveau 1 : les skills et leurs liens', () => {
  const { nodes, edges } = projectProcessToFlow(contract, 1);

  it('un nœud par skill, avec son nom et son en-clair', () => {
    expect(ids(nodes)).toEqual(['skill:ezk-backlog', 'skill:ezk-sprint', 'skill:ezk-retro', 'skill:ezk-archive']);
    expect(nodes[0]?.data).toMatchObject({ nom: 'Le backlog', enClair: expect.stringContaining('fiches') });
  });

  it('une arête par lien, avec son libellé, dont la boucle rétro vers backlog', () => {
    expect(edges).toHaveLength(contract.liens.length);
    const boucle = edges.find((e) => e.source === 'skill:ezk-retro' && e.target === 'skill:ezk-backlog');
    expect(boucle?.label).toBe('Les propositions retenues par le PO deviennent des fiches.');
  });
});

describe('projectProcessToFlow — niveau 2 : les étapes dans la boîte de leur skill', () => {
  const { nodes } = projectProcessToFlow(contract, 2);
  const steps = nodes.filter((n) => n.type === 'etape');

  it('toutes les étapes du contrat, ids stables, rangées dans leur skill', () => {
    expect(steps).toHaveLength(4 + 8 + 4 + 2);
    const first = steps.find((n) => n.id === 'etape:ezk-backlog:capturer');
    expect(first?.parentId).toBe('skill:ezk-backlog');
    expect(first?.data).toMatchObject({ titre: 'Capturer', num: 1 });
  });

  it('les skills passent avant leurs étapes (parent déclaré d’abord)', () => {
    const firstStep = nodes.findIndex((n) => n.type === 'etape');
    expect(nodes.slice(0, firstStep).every((n) => n.type === 'skill')).toBe(true);
  });
});

describe('projectProcessToFlow — niveau 3 : le détail des étapes', () => {
  const { nodes } = projectProcessToFlow(contract, 3);
  const data = (id: string) => nodes.find((n) => n.id === id)?.data as Record<string, unknown>;

  it('acteurs, commandes et réglages « clé = valeur »', () => {
    expect(data('etape:ezk-backlog:groomer')).toMatchObject({
      level: 3,
      acteurs: ['ezk-backlog:groom'],
      commandes: ['/ezk-backlog groom'],
      reglages: ['grooming.techniques = menu'],
    });
  });

  it('sans règle publiée, le dit', () => {
    expect(data('etape:ezk-backlog:groomer')?.regles).toEqual([]);
    expect(data('etape:ezk-backlog:groomer')?.reglesVide).toBe('aucune règle publiée');
  });
});

describe('projectProcessToFlow — positions fixes entre niveaux (ux/no-layout-shift)', () => {
  it('un même id de nœud garde la même position et la même taille aux 3 niveaux', () => {
    const n1 = projectProcessToFlow(contract, 1).nodes;
    const n2 = projectProcessToFlow(contract, 2).nodes;
    const n3 = projectProcessToFlow(contract, 3).nodes;
    for (const n of n1)
      expect(n2.find((m) => m.id === n.id)).toMatchObject({ position: n.position, width: n.width, height: n.height });
    for (const n of n2)
      expect(n3.find((m) => m.id === n.id)).toMatchObject({ position: n.position, width: n.width, height: n.height });
  });

  it('les skills ne se chevauchent pas', () => {
    const skills = projectProcessToFlow(contract, 1).nodes;
    for (const a of skills)
      for (const b of skills) {
        if (a === b) continue;
        const apart =
          a.position.x + (a.width ?? 0) <= b.position.x ||
          b.position.x + (b.width ?? 0) <= a.position.x ||
          a.position.y + (a.height ?? 0) <= b.position.y ||
          b.position.y + (b.height ?? 0) <= a.position.y;
        expect(apart).toBe(true);
      }
  });
});

describe('levelForZoom — hystérésis de 10 %', () => {
  const [LOW, HIGH] = ZOOM_THRESHOLDS;
  it('sans niveau précédent, le zoom donne le niveau', () => {
    expect(levelForZoom(0.3)).toBe(1);
    expect(levelForZoom(0.6)).toBe(2);
    expect(levelForZoom(2)).toBe(3);
  });

  it('pas de rebascule à ±5 % d’un seuil', () => {
    expect(levelForZoom(LOW * 0.95, 2)).toBe(2);
    expect(levelForZoom(LOW * 1.05, 1)).toBe(1);
    expect(levelForZoom(HIGH * 1.05, 2)).toBe(2);
    expect(levelForZoom(HIGH * 0.95, 3)).toBe(3);
  });

  it('bascule nette au-delà de 10 %', () => {
    expect(levelForZoom(LOW * 0.85, 2)).toBe(1);
    expect(levelForZoom(LOW * 1.15, 1)).toBe(2);
    expect(levelForZoom(HIGH * 1.15, 2)).toBe(3);
    expect(levelForZoom(HIGH * 0.85, 3)).toBe(2);
  });
});
