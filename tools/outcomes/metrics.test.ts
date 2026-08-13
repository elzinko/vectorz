import { describe, expect, it } from 'vitest';
import {
  REPRISE_WINDOW_DAYS,
  findHandoffIndex,
  prSansRetouche,
  reprisePostMerge,
  tempsDeCycle,
} from './metrics.js';
import type { PrCommit } from './sources.js';

function commit(overrides: Partial<PrCommit> & Pick<PrCommit, 'sha' | 'message'>): PrCommit {
  return {
    timestamp: '2026-08-01T00:00:00Z',
    authorType: 'agent',
    isMergeCommit: false,
    isRebase: false,
    isFormatting: false,
    ...overrides,
  };
}

describe('findHandoffIndex', () => {
  it('trouve le dernier commit agent', () => {
    const commits = [
      commit({ sha: 'a1', message: 'feat: start', authorType: 'agent' }),
      commit({ sha: 'a2', message: 'feat: finish', authorType: 'agent' }),
    ];
    expect(findHandoffIndex(commits)).toBe(1);
  });

  it('retourne -1 si aucun commit agent', () => {
    expect(findHandoffIndex([commit({ sha: 'h1', message: 'x', authorType: 'unknown' })])).toBe(-1);
  });
});

describe('prSansRetouche — AC3, fixtures représentatives de PRs réelles', () => {
  it('(a) commit substantiel d’auteur indéterminé post-handoff ⇒ null (non confirmable)', () => {
    const commits = [
      commit({ sha: 'a1', message: 'feat(outcomes): implémente X', authorType: 'agent' }),
      commit({ sha: 'h1', message: 'fix: corrige le bug trouvé en revue', authorType: 'unknown' }),
    ];
    // On ne peut PAS confirmer une retouche humaine faute de signal (finding Codex #3).
    expect(prSansRetouche(commits)).toBeNull();
  });

  it('(b) seulement rebase/format/merge post-handoff ⇒ true', () => {
    const commits = [
      commit({ sha: 'a1', message: 'feat(outcomes): implémente X', authorType: 'agent' }),
      commit({
        sha: 'h1',
        message: 'chore: rebase onto main',
        authorType: 'unknown',
        isRebase: true,
      }),
      commit({
        sha: 'h2',
        message: 'style: run biome format',
        authorType: 'unknown',
        isFormatting: true,
      }),
      commit({
        sha: 'h3',
        message: 'Merge pull request #99 from feat/x',
        authorType: 'unknown',
        isMergeCommit: true,
      }),
    ];
    expect(prSansRetouche(commits)).toBe(true);
  });

  it('aucune retouche quand le dernier commit est déjà agent ⇒ true', () => {
    const commits = [commit({ sha: 'a1', message: 'feat: solo', authorType: 'agent' })];
    expect(prSansRetouche(commits)).toBe(true);
  });

  it('aucun commit agent identifié ⇒ null (handoff introuvable, finding Codex #3)', () => {
    const commits = [
      commit({ sha: 'x1', message: 'feat: sans trailer', authorType: 'unknown' }),
      commit({ sha: 'x2', message: 'fix: sans trailer non plus', authorType: 'unknown' }),
    ];
    expect(prSansRetouche(commits)).toBeNull();
  });
});

describe('tempsDeCycle', () => {
  it('calcule le nombre de jours entre created et mergedAt', () => {
    expect(tempsDeCycle('2026-08-01T00:00:00Z', '2026-08-05T00:00:00Z')).toBe(4);
  });

  it('retourne null sur une date invalide', () => {
    expect(tempsDeCycle('not-a-date', '2026-08-05T00:00:00Z')).toBeNull();
  });
});

describe('reprisePostMerge — AC4', () => {
  it('requalifie un correctif sur les mêmes fichiers sous la fenêtre', () => {
    const original = { files: ['a.ts'], mergedAt: '2026-08-01T00:00:00Z' };
    const correctif = { files: ['a.ts', 'b.ts'], mergedAt: '2026-08-02T00:00:00Z' };
    expect(reprisePostMerge(original, correctif)).toBe(true);
  });

  it('requalifie un correctif sur la même fiche sous la fenêtre', () => {
    const original = { files: [], ficheId: '0044', mergedAt: '2026-08-01T00:00:00Z' };
    const correctif = { files: [], ficheId: '0044', mergedAt: '2026-08-03T00:00:00Z' };
    expect(reprisePostMerge(original, correctif)).toBe(true);
  });

  it('ne requalifie pas au-delà de la fenêtre X jours', () => {
    const original = { files: ['a.ts'], mergedAt: '2026-08-01T00:00:00Z' };
    const correctif = { files: ['a.ts'], mergedAt: '2026-08-10T00:00:00Z' };
    expect(reprisePostMerge(original, correctif)).toBe(false);
    expect(REPRISE_WINDOW_DAYS).toBe(3);
  });

  it('ne requalifie pas si ni fichiers ni fiche ne correspondent', () => {
    const original = { files: ['a.ts'], mergedAt: '2026-08-01T00:00:00Z' };
    const correctif = { files: ['z.ts'], mergedAt: '2026-08-02T00:00:00Z' };
    expect(reprisePostMerge(original, correctif)).toBe(false);
  });
});
