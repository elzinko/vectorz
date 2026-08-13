import { describe, expect, it } from 'vitest';
import {
  AGENT_BRANCH_PATTERN,
  StubSource,
  classifyCommitMessage,
  ficheIdFromBranch,
} from './sources.js';

describe('ficheIdFromBranch', () => {
  it('extrait un id legacy 4 chiffres', () => {
    expect(ficheIdFromBranch('feat/0044-mesureur-outcomes')).toBe('0044');
    expect(ficheIdFromBranch('fix/0002-bug')).toBe('0002');
  });

  it('extrait un id horodaté 17 chiffres', () => {
    expect(ficheIdFromBranch('feat/20260813131259846-slug')).toBe('20260813131259846');
  });

  it('retourne undefined si la branche ne porte pas d’id', () => {
    expect(ficheIdFromBranch('claude/zen-kalam-942a21')).toBeUndefined();
    expect(ficheIdFromBranch('docs/foo')).toBeUndefined();
    expect(ficheIdFromBranch('main')).toBeUndefined();
  });
});

describe('AGENT_BRANCH_PATTERN', () => {
  it('matche les préfixes de branche connus', () => {
    expect(AGENT_BRANCH_PATTERN.test('feat/0044-mesureur-outcomes')).toBe(true);
    expect(AGENT_BRANCH_PATTERN.test('claude/vectorz-product-builder-46c8b9')).toBe(true);
    expect(AGENT_BRANCH_PATTERN.test('docs/foo')).toBe(true);
  });

  it('rejette une branche hors convention', () => {
    expect(AGENT_BRANCH_PATTERN.test('main')).toBe(false);
    expect(AGENT_BRANCH_PATTERN.test('random-branch')).toBe(false);
  });
});

describe('classifyCommitMessage', () => {
  it('détecte un commit agent via le trailer Co-authored-by: Claude', () => {
    const c = classifyCommitMessage(
      'feat(x): y\n\nCo-authored-by: Claude Opus 4.8 <noreply@anthropic.com>',
    );
    expect(c.authorType).toBe('agent');
  });

  it('classe un commit sans trailer comme « unknown » (pas « human ») — finding Codex #3', () => {
    const c = classifyCommitMessage('fix typo directement en éditant le fichier');
    expect(c.authorType).toBe('unknown');
  });

  it('détecte un commit de merge', () => {
    expect(classifyCommitMessage('Merge pull request #12 from foo/bar').isMergeCommit).toBe(true);
  });

  it('détecte un commit de rebase', () => {
    expect(classifyCommitMessage('chore: rebase onto main').isRebase).toBe(true);
    expect(classifyCommitMessage('fixup! feat(x): y').isRebase).toBe(true);
  });

  it('détecte un commit de formatage', () => {
    expect(classifyCommitMessage('style: run biome format').isFormatting).toBe(true);
    expect(classifyCommitMessage('chore(format): apply prettier').isFormatting).toBe(true);
  });

  it('ne prend PAS un commit substantiel mentionnant « format » pour du formatage — Codex #P2', () => {
    const c = classifyCommitMessage('fix: preserve the legacy output format');
    expect(c.isFormatting).toBe(false);
    // Conséquence : ce commit compte comme retouche substantielle (pas exclu).
  });
});

describe('StubSource', () => {
  it('ne fait aucune I/O et retourne les données injectées', () => {
    const source = new StubSource(
      [
        {
          number: 1,
          branch: 'feat/x',
          mergedAt: '2026-01-01T00:00:00Z',
          files: ['a.ts'],
          commits: [],
        },
      ],
      [{ id: '0001', path: 'features/done/0001.md', created: '2026-01-01' }],
      [{ id: 'run-1', conforms: true }],
    );
    expect(source.countMergedAgentPrs()).toBe(1);
    expect(source.listMergedAgentPrs(10)).toHaveLength(1);
    expect(source.listDoneFiches()).toHaveLength(1);
    expect(source.listSupervisionRuns()).toHaveLength(1);
  });

  it('respecte la limite passée à listMergedAgentPrs', () => {
    const prs = Array.from({ length: 5 }, (_, i) => ({
      number: i,
      branch: 'feat/x',
      mergedAt: '2026-01-01T00:00:00Z',
      files: [],
      commits: [],
    }));
    const source = new StubSource(prs, [], []);
    expect(source.listMergedAgentPrs(2)).toHaveLength(2);
  });
});
