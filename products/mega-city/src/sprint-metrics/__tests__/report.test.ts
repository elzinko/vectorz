import { describe, expect, it } from 'vitest';
import { buildSprintReport } from '../domain/report.js';
import { renderSprintReportMarkdown } from '../domain/render.js';
import { SPRINT_REPORT_SCHEMA } from '../domain/types.js';

const baseInput = {
  slug: 'metriques-sprint',
  product: 'mega-city',
  window: { startTs: '2026-08-30T09:00:00.000Z', endTs: '2026-08-30T11:00:00.000Z', durationMs: 7_200_000 },
  tokens: { grain: 'sprint' as const, inputTokens: 300, outputTokens: 70, totalTokens: 370 },
  shippedFeatures: { count: 1, ids: ['20260826082120062'] },
  blockages: { count: 0, events: [] },
  prRetouches: { total: 1, sansRetouche: 1, indetermine: 0 },
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
      tokens: { grain: 'session', inputTokens: 10, outputTokens: 5, totalTokens: 15, note: 'repli honnête' },
    });
    expect(renderSprintReportMarkdown(report)).toMatch(/repli honnête/);
  });
});
