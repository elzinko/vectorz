/**
 * La mise en page de l'écran Process (fiche 20261117223348250) : le flux de gauche à droite, les
 * arcs déduits des données, les outils hors du flux. Lue sur le vrai contrat publié par la méthode.
 */
import { describe, expect, it } from 'vitest';
import { fitCamera, layoutProcess, wrapLabel } from './processLayout.js';
import type { ProcessShow } from './processShow.js';
import { processShowExample } from './testing/processShowExample.js';

const example = processShowExample();

describe('layoutProcess — le flux de gauche à droite', () => {
  it('pose les trois phases du flux en ligne, dans l’ordre, et l’archive à part', () => {
    const l = layoutProcess(example);
    expect(l.flow).toEqual(['ezk-backlog', 'ezk-sprint', 'ezk-retro']);
    expect(l.tools).toEqual(['ezk-archive']);
    const [b, s, r] = l.flow.map((id) => l.phases[id]);
    expect(b.x + b.w).toBeLessThan(s.x);
    expect(s.x + s.w).toBeLessThan(r.x);
    expect(b.y).toBe(s.y);
    // La boîte à outils est sous tout le flux.
    expect(l.phases['ezk-archive'].y).toBeGreaterThan(b.y + b.h);
    expect(l.toolsLabel?.y).toBeLessThan(l.phases['ezk-archive'].y);
  });

  it('range les étapes de chaque phase en rang, sans chevauchement, et tout tient dans le monde', () => {
    const l = layoutProcess(example);
    for (const skill of example.skills) {
      const boxes = skill.etapes.map((e) => l.steps[`${skill.id}:${e.id}`]);
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].x).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].w);
      const phase = l.phases[skill.id];
      for (const box of boxes) {
        expect(box.x).toBeGreaterThanOrEqual(phase.x);
        expect(box.x + box.w).toBeLessThanOrEqual(phase.x + phase.w);
      }
    }
    for (const r of Object.values(l.phases)) {
      expect(r.x + r.w).toBeLessThanOrEqual(l.world.w);
      expect(r.y + r.h).toBeLessThanOrEqual(l.world.h);
    }
  });
});

describe('layoutProcess — les arcs viennent des données', () => {
  it('un arc par lien et par boucle publiés, avec leur libellé, et aucun vers l’archive', () => {
    const l = layoutProcess(example);
    expect(l.arcs).toHaveLength(example.liens.length + example.boucles.length);
    const labels = l.arcs.map((a) => a.label.join(' '));
    for (const { libelle } of [...example.liens, ...example.boucles]) expect(labels).toContain(libelle);
  });

  it('déduit le genre de l’arc de sa géométrie : avant, arrière, échec, story suivante, sprint suivant', () => {
    const kinds = layoutProcess(example).arcs.map((a) => [a.label.join(' '), a.kind]);
    expect(kinds).toEqual(
      expect.arrayContaining([
        ['Le lot de fiches prêtes part en sprint.', 'flow'],
        ['Les propositions retenues par le PO deviennent des fiches.', 'improve'],
        ['Gate rouge, on reprend le code.', 'fail'],
        ['Revue NO-GO, on reprend le code.', 'fail'],
        ['Story suivante du lot.', 'story'],
        ['Sprint suivant, la boucle autonome tire un nouveau lot.', 'auto'],
      ]),
    );
  });

  it('une boucle ajoutée au contrat apparaît, sans toucher au code', () => {
    const more: ProcessShow = {
      ...example,
      boucles: [...example.boucles, { de: 'ezk-retro:juge', vers: 'ezk-retro:cadrer', libelle: 'Juge en désaccord.' }],
    };
    const arc = layoutProcess(more).arcs.find((a) => a.label.join(' ') === 'Juge en désaccord.');
    expect(arc?.kind).toBe('story');
  });

  it('ignore une boucle qui vise une étape absente, au lieu de dessiner dans le vide', () => {
    const bad: ProcessShow = { ...example, boucles: [{ de: 'ezk-sprint:inconnue', vers: 'ezk-sprint:code', libelle: 'x' }] };
    expect(layoutProcess(bad).arcs.some((a) => a.label.join(' ') === 'x')).toBe(false);
  });
});

describe('wrapLabel et fitCamera', () => {
  it('coupe un libellé au mot, sans perdre de mot', () => {
    const lines = wrapLabel('Les propositions retenues par le PO deviennent des fiches.', 20);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('Les propositions retenues par le PO deviennent des fiches.');
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(20);
  });

  it('cadre la cible au centre de la vue, sans dépasser l’échelle maximale', () => {
    const cam = fitCamera({ x: 100, y: 100, w: 200, h: 100 }, { w: 1000, h: 600 }, { margin: 40, top: 48, maxScale: 2.2 });
    expect(cam.s).toBe(2.2);
    expect(cam.tx + 100 * cam.s + (200 * cam.s) / 2).toBeCloseTo(500);
  });
});
