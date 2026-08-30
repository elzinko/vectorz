import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSprintReport } from '../domain/report.js';
import { validateSprintReport } from '../validator/validateSprintReport.js';

const completeReport = buildSprintReport({
  slug: 'metriques-sprint',
  product: 'mega-city',
  window: { startTs: '2026-08-30T09:00:00.000Z', endTs: '2026-08-30T11:00:00.000Z', durationMs: 7_200_000 },
  tokens: { grain: 'sprint', inputTokens: 300, outputTokens: 70, totalTokens: 370 },
  shippedFeatures: { count: 1, ids: ['20260826082120062'] },
  blockages: { count: 0, events: [] },
  prRetouches: { total: 1, sansRetouche: 1, indetermine: 0 },
  generatedAt: '2026-08-30T12:00:00.000Z',
});

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sprint-metrics-validator-'));
});

afterEach(() => {
  // fixtures jetables ; pas de cleanup explicite nécessaire (tmpdir), on ne
  // touche rien hors du dossier temporaire de toute façon.
});

function writeReport(obj: unknown): string {
  const path = join(dir, 'report.json');
  writeFileSync(path, JSON.stringify(obj, null, 2), 'utf8');
  return path;
}

describe('validateSprintReport', () => {
  it('accepte un rapport complet (code 0, zéro violation)', () => {
    const result = validateSprintReport(writeReport(completeReport));
    expect(result.violations).toEqual([]);
    expect(result.code).toBe(0);
  });

  it('refuse un rapport avec un champ manquant', () => {
    const { tokens: _tokens, ...truncated } = completeReport;
    const result = validateSprintReport(writeReport(truncated));
    expect(result.code).toBe(1);
    expect(result.violations.some((v) => v.code === 'report.missing_field')).toBe(true);
  });

  it('refuse quand kpi.shippedFeatures.count ≠ len(ids)', () => {
    const broken = { ...completeReport, kpi: { ...completeReport.kpi, shippedFeatures: { count: 5, ids: ['a'] } } };
    const result = validateSprintReport(writeReport(broken));
    expect(result.code).toBe(1);
    expect(result.violations.some((v) => v.code === 'kpi.count_mismatch')).toBe(true);
  });

  it('refuse une durée négative', () => {
    const broken = { ...completeReport, duration: { ms: -1, grain: 'sprint' } };
    const result = validateSprintReport(writeReport(broken));
    expect(result.code).toBe(1);
    expect(result.violations.some((v) => v.code === 'duration.negative')).toBe(true);
  });

  it('refuse un grain de tokens hors {sprint,session}', () => {
    const broken = { ...completeReport, tokens: { ...completeReport.tokens, grain: 'bogus' } };
    const result = validateSprintReport(writeReport(broken));
    expect(result.code).toBe(1);
    expect(result.violations.some((v) => v.code === 'tokens.invalid_grain')).toBe(true);
  });

  it('refuse somme(étapes) ≠ total quand le rapport prétend être ventilé', () => {
    const broken = {
      ...completeReport,
      steps: { ventilated: true, note: 'x', breakdown: [{ durationMs: 100 }, { durationMs: 100 }] },
    };
    const result = validateSprintReport(writeReport(broken));
    expect(result.code).toBe(1);
    expect(result.violations.some((v) => v.code === 'steps.sum_mismatch')).toBe(true);
  });

  it('refuse un fichier introuvable', () => {
    const result = validateSprintReport(join(dir, 'absent.json'));
    expect(result.code).toBe(1);
    expect(result.violations[0].code).toBe('report.missing');
  });

  it('émet une notice (pas une violation) quand le rapport MVP n’est pas ventilé', () => {
    const result = validateSprintReport(writeReport(completeReport));
    expect(result.notices.some((n) => n.code === 'steps.not_ventilated')).toBe(true);
    expect(result.code).toBe(0);
  });
});
