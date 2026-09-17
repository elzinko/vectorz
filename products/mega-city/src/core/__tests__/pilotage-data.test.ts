import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import type { RunReport } from '../../loaders/runs.js';
import {
  PILOTAGE_DATA_BEGIN,
  PILOTAGE_DATA_END,
  buildPilotageData,
  buildPilotageDataBlock,
  upsertPilotageDataBlock,
} from '../pilotage-data.js';

const F = (over: Partial<Fiche>): Fiche => ({
  id: '0001',
  title: 'X',
  type: 'feature',
  priority: 'P2',
  status: 'idea',
  ready: false,
  milestone: '',
  product: 'mega-city',
  pr: '',
  labels: [],
  blocked: '',
  done: false,
  file: 'features/0001-x.md',
  ...over,
});

const R = (over: Partial<RunReport>): RunReport => ({
  file: 'docs/sessions/2026-01-01-x.md',
  date: '2026-01-01',
  slug: 'x',
  title: 'X',
  fiches: [],
  prs: [],
  ...over,
});

describe('buildPilotageData — composition avancement + runs', () => {
  it('reprend les milestones (avancement) et résume les runs', () => {
    const data = buildPilotageData(
      [
        F({ id: '1', milestone: 'fondation', status: 'shipped', done: true }),
        F({ id: '2', milestone: 'fondation', status: 'idea' }),
      ],
      [R({ prs: ['10'] }), R({ prs: [] })],
    );
    expect(data.milestones.map((m) => m.milestone)).toEqual(['fondation']);
    expect(data.milestones[0]?.total).toBe(2);
    expect(data.milestones[0]?.shipped).toBe(1);
    expect(data.runs).toEqual({ total: 2, withPr: 1, prs: 1 });
  });

  it('pas de fiche/run → structures vides, pas de crash', () => {
    expect(buildPilotageData([], [])).toEqual({
      milestones: [],
      runs: { total: 0, withPr: 0, prs: 0 },
    });
  });
});

describe('bloc de données de pilotage.html', () => {
  it('upsert remplace entre les marqueurs', () => {
    const html = `a ${PILOTAGE_DATA_BEGIN}\nOLD\n${PILOTAGE_DATA_END} b`;
    const out = upsertPilotageDataBlock(html, buildPilotageDataBlock([], []));
    expect(out).toContain('window.EZK_PILOTAGE =');
    expect(out).not.toContain('OLD');
    expect(out.startsWith('a ')).toBe(true);
    expect(out.endsWith(' b')).toBe(true);
  });

  it('échoue franchement si les marqueurs manquent', () => {
    expect(() => upsertPilotageDataBlock('<title>x</title>', 'bloc')).toThrow(/marqueurs/);
  });
});
