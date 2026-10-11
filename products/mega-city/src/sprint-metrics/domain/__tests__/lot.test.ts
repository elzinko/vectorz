/**
 * lot — le périmètre « ce sprint » = section `## Lot` de SPRINT.md (fiche 20261008072305169, ADR-0068).
 * Parseur PUR : on lit `## Lot`, jamais `## Incréments scellés de la session` (zone polluée par héritage).
 */
import { describe, expect, it } from 'vitest';
import { parseSprintLot } from '../lot.js';

const SPRINT_MD = `# Sprint 2 — objectif
Statut: en cours   Ouvert: 2026-10-11

## Lot  (1 ligne = 1 story = 1 PR ; [x] livrée · [~] reportée · [ ] ouverte)
- [x] 20261010215345931 — Le tirage reste dans la version en cours (garde-fou de séquence) (PR #12)
- [~] 20261008072305169 — Au close, le sprint écrit son compte rendu (reportée : bloqué)
- [ ] 20260101000000001 — Une story restée ouverte

## Incréments scellés de la session
- Sprint 1 — socle — 2 livrées : 99999999999999999 (local abcd1234)
`;

describe('parseSprintLot', () => {
  it('lit la section ## Lot et son résultat par story ([x]/[~]/[ ])', () => {
    const entries = parseSprintLot(SPRINT_MD);
    expect(entries).toEqual([
      { id: '20261010215345931', result: 'shipped', title: 'Le tirage reste dans la version en cours (garde-fou de séquence)' },
      { id: '20261008072305169', result: 'reported', title: 'Au close, le sprint écrit son compte rendu' },
      { id: '20260101000000001', result: 'open', title: 'Une story restée ouverte' },
    ]);
  });

  it('ignore ## Incréments scellés de la session (jamais le périmètre)', () => {
    const entries = parseSprintLot(SPRINT_MD);
    expect(entries.map((e) => e.id)).not.toContain('99999999999999999');
  });

  it('retire les suffixes de cycle de vie (PR #N) et (reportée : …) du titre', () => {
    const entries = parseSprintLot(SPRINT_MD);
    expect(entries[0].title).not.toMatch(/PR #/);
    expect(entries[1].title).not.toMatch(/reportée/i);
  });

  it('rend un lot vide quand il n’y a pas de section ## Lot', () => {
    expect(parseSprintLot('# Sprint\n\n## Notes\n- rien\n')).toEqual([]);
  });

  it('accepte les ids legacy à 4 chiffres', () => {
    expect(parseSprintLot('## Lot\n- [x] 0171 — Fiche legacy\n')).toEqual([
      { id: '0171', result: 'shipped', title: 'Fiche legacy' },
    ]);
  });
});
