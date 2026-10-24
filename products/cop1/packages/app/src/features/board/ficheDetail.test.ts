/**
 * Sœur « plan réel » du board (détail de fiche) : le cœur pur `parseFicheDetail` extrait de quoi
 * remplir la modale — en-clair, contexte, critères (sans la case), comment vérifier — et mappe le statut.
 */
import { describe, expect, it } from 'vitest';
import { ficheIdFromFilename } from './backlogReader.js';
import { parseFicheDetail } from './ficheDetail.js';

const SAMPLE = `---
id: "123"
title: "Une fiche"
priority: P1
status: ready
version: "v0.2.0"
pr:
---

# 123 — Une fiche

**En clair.** Le board doit montrer le détail.

## Contexte / Problème

Le symptôme vécu.

## Critères d'acceptation

- [ ] Premier critère
- [x] Deuxième critère fait

## Comment vérifier

\`\`\`bash
pnpm test
\`\`\`
`;

describe('parseFicheDetail — le détail pour la modale', () => {
  it('extrait en-clair, contexte, critères (sans la case) et comment vérifier', () => {
    const d = parseFicheDetail(SAMPLE);
    expect(d).not.toBeNull();
    expect(d?.id).toBe('123');
    expect(d?.title).toBe('Une fiche');
    expect(d?.prio).toBe('P1');
    expect(d?.status).toBe('ready');
    expect(d?.ver).toBe('v0.2.0');
    expect(d?.enclair).toBe('Le board doit montrer le détail.');
    expect(d?.ctx).toBe('Le symptôme vécu.');
    expect(d?.crit).toEqual(['Premier critère', 'Deuxième critère fait']);
    expect(d?.verif).toContain('pnpm test');
  });

  it('mappe le statut et rend null sans id', () => {
    expect(parseFicheDetail('pas de front-matter')).toBeNull();
    expect(parseFicheDetail(SAMPLE.replace('status: ready', 'status: in-progress'))?.status).toBe('wip');
    expect(parseFicheDetail(SAMPLE, true)?.status).toBe('done'); // done=true → vient de done/
  });

  it('un statut actif inconnu par défaut → idea, jamais done (constat S4)', () => {
    expect(parseFicheDetail(SAMPLE.replace('status: ready', 'status: '))?.status).toBe('idea');
  });
});

describe('ficheIdFromFilename — l’id exact vient du nom de fichier (constats S1/S2)', () => {
  it('préserve les zéros de tête et les 17 chiffres (pas de coercition numérique)', () => {
    expect(ficheIdFromFilename('0029-slug.md')).toBe('0029');
    expect(ficheIdFromFilename('20261024130842122_board-web.md')).toBe('20261024130842122');
    expect(ficheIdFromFilename('README.md')).toBe('');
  });
});

describe('parseFicheDetail — robustesse (constats S1/S2/S3)', () => {
  it('l’id du nom de fichier est prioritaire et survit à un YAML invalide', () => {
    // Titre non quoté avec « : » → YAML jette ; la fiche ne doit PAS disparaître.
    const broken = '---\ntitle: Self-hosting: le jour où\nstatus: idea\n---\n\n**En clair.** x';
    const d = parseFicheDetail(broken, false, '0043');
    expect(d).not.toBeNull();
    expect(d?.id).toBe('0043');
  });

  it('une section n’est pas tronquée par un `## ` dans un bloc de code', () => {
    const withFence = [
      '---',
      'id: "7"',
      'status: ready',
      '---',
      '## Contexte / Problème',
      '',
      'Avant le bloc.',
      '',
      '```sh',
      '## installe',
      'echo hi',
      '```',
      '',
      'Après le bloc.',
      '',
      '## Critères d’acceptation',
      '',
      '- [ ] un critère',
      '',
    ].join('\n');
    const d = parseFicheDetail(withFence);
    expect(d?.ctx).toContain('Après le bloc.'); // pas coupé au `## installe` du bloc
    expect(d?.crit).toEqual(['un critère']); // section Critères bien trouvée après le bloc
  });
});
