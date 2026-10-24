import { describe, expect, it } from 'vitest';
import { StubJournalSource, StubRepoSource, StubTranscriptSource } from '../adapters/stubs.js';
import { collectSprintReport } from '../collect.js';

const SPRINT_START = '2026-08-30T09:00:00.000Z';
const SPRINT_END = '2026-08-30T11:00:00.000Z';

function fixturePorts() {
  const journal = new StubJournalSource(
    [
      { ts: SPRINT_START, slug: 'precedent', runId: 'run-1' },
      { ts: SPRINT_END, slug: 'metriques-sprint', runId: 'run-1' },
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
    expect(report.tokens).toEqual({ grain: 'sprint', inputTokens: 300, outputTokens: 70, cacheRead: 0, cacheCreation: 0, totalTokens: 370 });
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

  it('lève une erreur explicite quand AUCUN checkpoint de sprint n’existe', () => {
    const ports = fixturePorts();
    const aucun = new StubJournalSource([]);
    expect(() => collectSprintReport(input, { ...ports, journal: aucun })).toThrow(/impossible de dater/i);
  });

  it('un checkpoint au slug différent DATE quand même le sprint (fiche 20261002230039863)', () => {
    // Le slug du gate diffère de celui de l'objectif : on ne jette plus, on date depuis le checkpoint
    // le plus récent (celui du run qu'on vient de clore).
    const ports = fixturePorts();
    // Le checkpoint est DANS le run courant (run-1), juste avec un slug différent de l'objectif.
    const slugDifferent = new StubJournalSource([{ ts: SPRINT_START, slug: 'autre-sprint', runId: 'run-1' }], [], undefined, 'run-1');
    const report = collectSprintReport(input, { ...ports, journal: slugDifferent });
    expect(report.duration.ms).toBeGreaterThanOrEqual(0);
    expect(report.tokens.note ?? '').not.toMatch(/supervision absente/i);
  });

  it('lit le lot scellé depuis SPRINT.md (## Lot), avec le résultat par story', () => {
    const sprintMd = '## Lot\n- [x] 20260826082120062 — Rapport (PR #9)\n- [~] 20991231000000001 — Reportée (reportée : X)\n';
    const report = collectSprintReport({ ...input, sprintMd }, fixturePorts());
    expect(report.lot.entries).toEqual([
      { id: '20260826082120062', result: 'shipped', title: 'Rapport' },
      { id: '20991231000000001', result: 'reported', title: 'Reportée' },
    ]);
  });

  it('allowUndated : sans AUCUN checkpoint, rend un rapport NON DATÉ (lot gardé, durée/tokens à zéro + mention)', () => {
    const ports = fixturePorts();
    const aucun = new StubJournalSource([]);
    const sprintMd = '## Lot\n- [x] 20260826082120062 — Rapport\n';
    const report = collectSprintReport({ ...input, sprintMd, allowUndated: true }, { ...ports, journal: aucun });
    expect(report.duration.ms).toBe(0);
    expect(report.tokens.totalTokens).toBe(0);
    expect(report.tokens.note).toMatch(/supervision absente/i);
    expect(report.lot.entries).toEqual([{ id: '20260826082120062', result: 'shipped', title: 'Rapport' }]);
  });
});
