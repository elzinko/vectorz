import { describe, expect, it } from 'vitest';
import { type RepoSignals, extractCandidates, renderCandidates } from '../core/scout-extract.js';

const signals = (over: Partial<RepoSignals> = {}): RepoSignals => ({
  deps: [],
  configFiles: [],
  commitSubjects: [],
  ...over,
});

describe('extractCandidates — amorçage brownfield (fiche 20261007151859473)', () => {
  it('rien d’observable → aucune règle candidate (jamais de candidat sans preuve)', () => {
    expect(extractCandidates(signals())).toEqual([]);
  });

  it('biome.json → candidat code-style/biome-format avec sa preuve', () => {
    const [c] = extractCandidates(signals({ configFiles: ['biome.json'] }));
    expect(c.id).toBe('code-style/biome-format');
    expect(c.category).toBe('code-style');
    expect(c.evidence).toContain('biome.json');
  });

  it('@biomejs/biome en dépendance → même candidat (preuve = dépendance)', () => {
    const [c] = extractCandidates(signals({ deps: ['@biomejs/biome'] }));
    expect(c.id).toBe('code-style/biome-format');
    expect(c.evidence).toContain('dépendance');
  });

  it('vitest en dépendance + tsconfig.json → candidats testing + typing', () => {
    const ids = extractCandidates(
      signals({ deps: ['vitest'], configFiles: ['tsconfig.json'] }),
    ).map((c) => c.id);
    expect(ids).toContain('testing/framework');
    expect(ids).toContain('typing/typescript');
  });

  it('une majorité nette de commits conventionnels → candidat MUST conventional-commits', () => {
    const subjects = [
      'feat(x): a',
      'fix: b',
      'docs(y): c',
      'chore: d',
      'refactor(z): e',
      'blabla non conforme',
    ];
    const [c] = extractCandidates(signals({ commitSubjects: subjects }));
    expect(c.id).toBe('conventional-commits/format');
    expect(c.level).toBe('MUST');
    expect(c.evidence).toContain('5/6');
  });

  it('trop peu de commits, ou pas de majorité → pas de candidat commit', () => {
    expect(extractCandidates(signals({ commitSubjects: ['feat: a', 'feat: b'] }))).toEqual([]); // < 5
    const mostlyBad = ['x', 'y', 'z', 'w', 'v', 'feat: a'];
    expect(extractCandidates(signals({ commitSubjects: mostlyBad }))).toEqual([]); // 1/6 < 0.7
  });

  it('le rendu dit « À ARBITRER » et n’affirme jamais avoir écrit', () => {
    const txt = renderCandidates(extractCandidates(signals({ configFiles: ['biome.json'] })));
    expect(txt).toContain('ARBITRER');
    expect(renderCandidates([])).toContain('Aucune règle candidate');
  });
});
