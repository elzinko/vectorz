/**
 * Les lignes de plan proposées pour des fiches absentes du plan (fiche 20261101131506254) : au format
 * du plan, rangées par milestone, jamais pour une fiche déjà au plan.
 */
import { describe, expect, it } from 'vitest';
import { formatPlanProposals, planLine, proposePlanLines } from '../plan-proposal.js';

const fiche = (id: string, status: string, milestone: string) => ({ id, title: `Fiche ${id}`, status, milestone });

describe('planLine', () => {
  it('une fiche prête se construit, une idée se groome', () => {
    expect(planLine(fiche('a', 'ready', 'm'))).toBe('- `a` — Fiche a · build');
    expect(planLine(fiche('b', 'idea', 'm'))).toBe('- `b` — Fiche b · groom');
  });
});

describe('proposePlanLines', () => {
  it('range par milestone et saute une fiche déjà au plan', () => {
    const out = proposePlanLines([fiche('a', 'idea', 'board'), fiche('b', 'idea', 'board'), fiche('c', 'ready', 'qualite')], ['b']);
    expect(out).toEqual([
      { milestone: 'board', lines: ['- `a` — Fiche a · groom'] },
      { milestone: 'qualite', lines: ['- `c` — Fiche c · build'] },
    ]);
  });

  it('toutes déjà au plan : rien à proposer, rien à afficher', () => {
    expect(proposePlanLines([fiche('a', 'idea', 'board')], ['a'])).toEqual([]);
    expect(formatPlanProposals([])).toEqual([]);
  });
});

describe('formatPlanProposals', () => {
  it('dit où copier chaque ligne, et signale une fiche sans milestone', () => {
    const out = formatPlanProposals(proposePlanLines([fiche('a', 'idea', 'board'), fiche('z', 'idea', '')], []));
    expect(out[0]).toContain('features/PLAN.md');
    expect(out).toContain('  milestone `board` :');
    expect(out).toContain('    - `a` — Fiche a · groom');
    expect(out).toContain('  sans milestone (choisis-en une) :');
  });
});
