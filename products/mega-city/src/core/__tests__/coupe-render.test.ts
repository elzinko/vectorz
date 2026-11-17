/**
 * Le rendu de la coupe : texte du dry-run et fichier de version (ADR-0088 §7), purs.
 */
import { describe, expect, it } from 'vitest';
import type { Coupe, FicheDeCoupe } from '../coupe.js';
import { renderCoupe, renderVersionFile } from '../coupe-render.js';

const fc = (id: string, titre: string, objectif: string, type = 'feature'): FicheDeCoupe => ({ id, titre, objectif, type, versionPosee: '', file: `${id}.md` });
const coupe: Coupe = {
  derniereEtiquette: 'v0.22.0',
  fiches: [],
  objectifs: [
    { objectif: 'board', fiches: [fc('1', 'Un', 'board')], livrees: 1, total: 1, complet: true },
    { objectif: 'carte', fiches: [fc('2', 'Deux', 'carte')], livrees: 1, total: 3, complet: false },
  ],
  sansObjectif: [fc('4', 'Libre', '')],
  correctifs: [fc('3', 'Réparé', '', 'bug')],
  reecrites: [fc('5', 'Déjà posée', '')],
  horsCoupe: 7,
};

describe('renderCoupe', () => {
  const texte = renderCoupe(coupe, { ok: true, numero: 'v0.23.0', origine: 'propose', genre: 'mineure' }).join('\n');

  it('ouvre par « En clair » et donne le numéro proposé', () => {
    expect(texte.startsWith('En clair :')).toBe(true);
    expect(texte).toContain('v0.23.0');
  });

  it('dit complet ou partiel k/n par objectif, et liste les correctifs', () => {
    expect(texte).toContain('board — complet');
    expect(texte).toContain('carte — partiel 1/3');
    expect(texte).toContain('Réparé');
  });

  it('avertit des version: réécrites et compte l’historique hors coupe', () => {
    expect(texte).toContain('réécrit');
    expect(texte).toContain('7');
  });

  it('rend les refus quand le numéro est refusé', () => {
    const refus = renderCoupe(coupe, { ok: false, raisons: ['trop petit'] }).join('\n');
    expect(refus).toContain('refusé');
    expect(refus).toContain('trop petit');
  });
});

describe('renderVersionFile', () => {
  const md = renderVersionFile({
    version: 'v0.23.0',
    date: '2026-11-17',
    commit: 'abc1234',
    gate: 'GO',
    origine: 'propose',
    coupe,
  });

  it('porte le front-matter lu par le loader des versions', () => {
    expect(md).toMatch(/^---\nversion: v0\.23\.0\ndate: 2026-11-17\ncommit: abc1234\ngate: GO\nnumero: propose\n---\n/);
  });

  it('écrit les notes par objectif puis par correctif', () => {
    expect(md).toContain('## board');
    expect(md).toContain('## carte (partiel 1/3)');
    expect(md).toContain('## Correctifs');
    expect(md).toContain('- Réparé');
  });
});
