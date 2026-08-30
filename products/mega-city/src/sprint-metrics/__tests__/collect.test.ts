import { describe, expect, it } from 'vitest';
import { StubJournalSource, StubRepoSource, StubTranscriptSource } from '../adapters/stubs.js';
import { collectSprintReport } from '../collect.js';

const SPRINT_START = '2026-08-30T09:00:00.000Z';
const SPRINT_END = '2026-08-30T11:00:00.000Z';

function fixturePorts() {
  const journal = new StubJournalSource(
    [
      { ts: SPRINT_START, slug: 'precedent' },
      { ts: SPRINT_END, slug: 'metriques-sprint' },
    ],
    [{ ts: '2026-08-30T10:00:00.000Z', detail: 'gh indisponible' }],
  );
  const transcript = new StubTranscriptSource([
    { ts: '2026-08-30T09:30:00.000Z', sessionId: 's1', inputTokens: 100, outputTokens: 50 },
    { ts: '2026-08-30T10:30:00.000Z', sessionId: 's1', inputTokens: 200, outputTokens: 20 },
    { ts: '2026-08-30T13:00:00.000Z', sessionId: 's1', inputTokens: 999, outputTokens: 999 }, // hors fenêtre
  ]);
  const repo = new StubRepoSource(
    [{ id: '20260826082120062', mergedAt: '2026-08-30T09:45:00.000Z' }],
    [{ mergedAt: '2026-08-30T10:00:00.000Z', commits: [{ authorType: 'agent', isMergeCommit: false, isRebase: false, isFormatting: false }] }],
  );
  return { journal, transcript, repo };
}

const input = {
  projectRoot: '/fake/project',
  repoRoot: '/fake/repo',
  slug: 'metriques-sprint',
  product: 'mega-city',
  now: () => '2026-08-30T12:00:00.000Z',
};

describe('collectSprintReport', () => {
  it('(i) produit un rapport avec les 3 familles : durée, tokens, KPI scrum', () => {
    const report = collectSprintReport(input, fixturePorts());
    expect(report.duration.ms).toBe(2 * 60 * 60 * 1000);
    expect(report.tokens).toEqual({ grain: 'sprint', inputTokens: 300, outputTokens: 70, totalTokens: 370 });
    expect(report.kpi.shippedFeatures).toEqual({ count: 1, ids: ['20260826082120062'] });
    expect(report.kpi.blockages.count).toBe(1);
    expect(report.kpi.prRetouches).toEqual({ total: 1, sansRetouche: 1, indetermine: 0 });
  });

  it('(iii) déterminisme : rejouer la collecte 2× sur les mêmes fixtures → chiffres identiques', () => {
    const first = collectSprintReport(input, fixturePorts());
    const second = collectSprintReport(input, fixturePorts());
    expect(second).toEqual(first);
  });

  it('(iv) repli honnête au grain session quand le fenêtrage tokens est vide', () => {
    const ports = fixturePorts();
    const outOfWindowTranscript = new StubTranscriptSource([
      { ts: '2026-08-30T07:00:00.000Z', sessionId: 's1', inputTokens: 10, outputTokens: 5 },
      { ts: '2026-08-30T14:00:00.000Z', sessionId: 's1', inputTokens: 20, outputTokens: 5 },
    ]);
    const report = collectSprintReport(input, { ...ports, transcript: outOfWindowTranscript });
    expect(report.tokens.grain).toBe('session');
    expect(report.tokens.totalTokens).toBe(40);
    expect(report.tokens.note).toBeDefined();
  });

  it('lève une erreur explicite si aucun checkpoint ne porte le slug demandé', () => {
    const ports = fixturePorts();
    const noMatch = new StubJournalSource([{ ts: SPRINT_START, slug: 'autre-sprint' }]);
    expect(() => collectSprintReport(input, { ...ports, journal: noMatch })).toThrow(/aucun gate/i);
  });
});
