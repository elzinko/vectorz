import { describe, expect, it } from 'vitest';
import { buildSprintReport } from '../domain/report.js';
import { renderSprintReportMarkdown } from '../domain/render.js';
import { SPRINT_REPORT_SCHEMA } from '../domain/types.js';

const baseInput = {
  slug: 'metriques-sprint',
  product: 'mega-city',
  window: { startTs: '2026-08-30T09:00:00.000Z', endTs: '2026-08-30T11:00:00.000Z', durationMs: 7_200_000 },
  tokens: { grain: 'sprint' as const, inputTokens: 300, outputTokens: 70, cacheRead: 0, cacheCreation: 0, totalTokens: 370 },
  shippedFeatures: { count: 1, ids: ['20260826082120062'] },
  blockages: { count: 0, events: [] },
  prRetouches: { total: 1, sansRetouche: 1, indetermine: 0 },
  lot: { entries: [{ id: '20260826082120062', result: 'shipped' as const, title: 'Rapport de sprint' }] },
  generatedAt: '2026-08-30T12:00:00.000Z',
};

describe('buildSprintReport', () => {
  it('assemble un rapport complet, jamais ventilé par étape en MVP', () => {
    const report = buildSprintReport(baseInput);
    expect(report.schema).toBe(SPRINT_REPORT_SCHEMA);
    expect(report.sprint).toEqual({ slug: 'metriques-sprint', product: 'mega-city' });
    expect(report.duration).toEqual({ ms: 7_200_000, grain: 'sprint' });
    expect(report.steps.ventilated).toBe(false);
    expect(report.kpi.shippedFeatures.count).toBe(1);
  });
});

describe('renderSprintReportMarkdown', () => {
  it('ouvre par « En clair » et mentionne les 3 familles de métriques', () => {
    const md = renderSprintReportMarkdown(buildSprintReport(baseInput));
    const enClairIndex = md.indexOf('## En clair');
    expect(enClairIndex).toBeGreaterThan(-1);
    expect(enClairIndex).toBeLessThan(md.indexOf('## Détail'));
    expect(md).toMatch(/durée/i);
    expect(md).toMatch(/tokens/i);
    expect(md).toMatch(/fiche/i);
  });

  it('signale explicitement le repli grain session quand présent', () => {
    const report = buildSprintReport({
      ...baseInput,
      tokens: { grain: 'session', inputTokens: 10, outputTokens: 5, cacheRead: 0, cacheCreation: 0, totalTokens: 15, note: 'repli honnête' },
    });
    expect(renderSprintReportMarkdown(report)).toMatch(/repli honnête/);
  });

  it('rapporte le cache à part et ventile les jetons par mode (fiche 20261017110956989)', () => {
    const report = buildSprintReport({
      ...baseInput,
      // entrée 300 + sortie 70 + cache lu 2000 + cache créé 300 = 2670, mode local
      tokens: { grain: 'sprint', inputTokens: 300, outputTokens: 70, cacheRead: 2000, cacheCreation: 300, totalTokens: 2670, mode: 'local' },
    });
    const md = renderSprintReportMarkdown(report);
    expect(md).toMatch(/cache lu 2000/);
    expect(md).toMatch(/cache créé 300/);
    // Jetons par mode : local porte le total, pr-codex à 0, et la somme égale le total (rien perdu).
    expect(md).toMatch(/Jetons par mode.*mode `local`.*local 2670.*pr-codex 0.*somme = total 2670/);
  });
});
