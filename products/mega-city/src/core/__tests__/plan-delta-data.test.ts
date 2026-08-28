import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import { buildPlanDelta } from '../plan-delta-data.js';

/** Fabrique une fiche mock : défauts raisonnables, surchargés par `over`. */
const f = (over: Partial<Fiche> & { id: string }): Fiche => ({
  title: `T-${over.id}`,
  type: 'feature',
  priority: 'P2',
  status: 'todo',
  ready: false,
  epic: '',
  product: 'mega-city',
  pr: '',
  labels: [],
  done: false,
  file: `features/${over.id}_x.md`,
  ...over,
});

describe('buildPlanDelta (fiche 20260828165644386 — vue écart-plan)', () => {
  it('badge inPlan = vrai même pour un id en 2ᵉ+ position d’une ligne multi-ids', () => {
    const plan = [
      '## ⏳ LATER',
      '- ⚠️ **Distribution** — 0087 · 0050 · 0096 · 0186. NE PAS PUBLIER.',
    ].join('\n');
    const fiches = [f({ id: '0050' }), f({ id: '0099' })];
    const delta = buildPlanDelta(plan, fiches, 15);
    expect(delta.recent.find((c) => c.id === '0050')?.inPlan).toBe(true); // capté en 2ᵉ position
    expect(delta.recent.find((c) => c.id === '0099')?.inPlan).toBe(false); // absent du plan
  });

  it('recent = les N dernières par id (desc), fenêtre réglable', () => {
    const fiches = [
      '20260810000000001',
      '20260820000000002',
      '20260828000000003',
      '20260829000000004',
    ].map((id) => f({ id }));
    const delta = buildPlanDelta('', fiches, 2);
    expect(delta.recent.map((c) => c.id)).toEqual(['20260829000000004', '20260828000000003']);
    expect(delta.n).toBe(2);
  });

  it('recent exclut les livrées (shipped / done) mais INCLUT les idées', () => {
    const fiches = [
      f({ id: '20260829000000009', status: 'idea' }),
      f({ id: '20260829000000008', status: 'shipped', done: true }),
      f({ id: '20260829000000007', status: 'todo' }),
    ];
    const ids = buildPlanDelta('', fiches).recent.map((c) => c.id);
    expect(ids).toContain('20260829000000009'); // idée récente = un arrivant
    expect(ids).toContain('20260829000000007');
    expect(ids).not.toContain('20260829000000008'); // livrée, exclue
  });

  it('offPlanCount = actionnables hors plan (todo/in-progress/blocked), idées EXCLUES', () => {
    const plan = ['## ▶️ NOW', '1. **0100** — dans le plan · `build`'].join('\n');
    const fiches = [
      f({ id: '0100', status: 'todo' }), // dans le plan → pas compté
      f({ id: '0201', status: 'todo' }), // hors plan, actionnable → +1
      f({ id: '0202', status: 'in-progress' }), // hors plan, actionnable → +1
      f({ id: '0203', status: 'blocked' }), // hors plan, actionnable → +1
      f({ id: '0204', status: 'idea' }), // hors plan mais IDÉE → pas compté
      f({ id: '0205', status: 'shipped', done: true }), // livrée → pas compté
    ];
    expect(buildPlanDelta(plan, fiches).offPlanCount).toBe(3);
  });

  it('robuste : moins de N fiches, plan et backlog vides', () => {
    expect(buildPlanDelta('', []).recent).toEqual([]);
    expect(buildPlanDelta('', []).offPlanCount).toBe(0);
    expect(buildPlanDelta('', [f({ id: '20260829000000001' })], 15).recent).toHaveLength(1);
  });
});
