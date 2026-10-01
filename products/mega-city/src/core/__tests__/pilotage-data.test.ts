import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import type { RunReport } from '../../loaders/runs.js';
import {
  PILOTAGE_DATA_BEGIN,
  PILOTAGE_DATA_END,
  buildPilotageData,
  buildPilotageDataBlock,
} from '../pilotage-data.js';

const F = (over: Partial<Fiche>): Fiche => ({
  id: '0001',
  title: 'X',
  type: 'feature',
  priority: 'P2',
  status: 'idea',
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

describe('bloc de données de pilotage (pilotage.data.js)', () => {
  it('est délimité par ses marqueurs et affecte window.EZK_PILOTAGE', () => {
    const block = buildPilotageDataBlock([], []);
    expect(block.startsWith(PILOTAGE_DATA_BEGIN)).toBe(true);
    expect(block.endsWith(PILOTAGE_DATA_END)).toBe(true);
    expect(block).toContain('window.EZK_PILOTAGE =');
  });
});
