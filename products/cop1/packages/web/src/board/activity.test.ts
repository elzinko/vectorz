import { describe, expect, it } from 'vitest';
import { momentLabel, runChips, runHasLens, runsForLens, verdictClass } from './activity.js';
import type { BoardProject, BoardRun } from './types.js';

const RUN_CAD: BoardRun = {
  id: 'rc',
  name: 'Cadrage',
  ver: 'v1',
  live: true,
  kind: 'cadrage',
  verdict: 'en cours',
  moments: [{ step: 'grooming', label: 'Grooming', fiches: [] }],
};
const RUN_DEV: BoardRun = {
  id: 'rd',
  name: 'Réalisation',
  ver: 'v1',
  live: false,
  kind: 'dev',
  verdict: 'GO',
  moments: [
    { step: 'sprint', n: 1, label: 'S1', fiches: [] },
    { step: 'sprint', n: 2, label: 'S2', fiches: [] },
    { step: 'retro', label: 'Rétro', fiches: [] },
  ],
};

const PROJECT = {
  runs: { rc: RUN_CAD, rd: RUN_DEV },
} as unknown as BoardProject;

describe('runHasLens / runsForLens', () => {
  it('range un run selon ses moments', () => {
    expect(runHasLens(RUN_CAD, 'cadrage')).toBe(true);
    expect(runHasLens(RUN_CAD, 'dev')).toBe(false);
    expect(runHasLens(RUN_DEV, 'dev')).toBe(true);
    expect(runHasLens(RUN_DEV, 'cadrage')).toBe(false);
  });

  it('filtre les runs par lentille', () => {
    expect(runsForLens(PROJECT, 'cadrage').map((r) => r.id)).toEqual(['rc']);
    expect(runsForLens(PROJECT, 'dev').map((r) => r.id)).toEqual(['rd']);
  });

  it('un run sans moments n’apparaît dans aucune lentille', () => {
    const bare: BoardRun = { id: 'x', name: 'x', ver: 'v1', live: false };
    expect(runHasLens(bare, 'cadrage')).toBe(false);
    expect(runHasLens(bare, 'dev')).toBe(false);
  });
});

describe('runChips', () => {
  it('numérote les sprints et nomme les étapes', () => {
    expect(runChips(RUN_DEV, 'dev').map((c) => c.label)).toEqual(['S1', 'S2', 'rétro']);
    expect(runChips(RUN_CAD, 'cadrage').map((c) => c.label)).toEqual(['groom']);
  });

  it('ne garde que les moments de la lentille', () => {
    expect(runChips(RUN_DEV, 'cadrage')).toEqual([]);
  });
});

describe('momentLabel / verdictClass', () => {
  it('momentLabel prend le label, sinon la pastille', () => {
    expect(momentLabel({ step: 'grooming', label: 'Grooming du lot', fiches: [] })).toBe('Grooming du lot');
    expect(momentLabel({ step: 'grooming', fiches: [] })).toBe('groom');
  });

  it('verdictClass : GO vert, NO rouge, vivant vert, sinon orange', () => {
    expect(verdictClass({ ...RUN_DEV, verdict: 'GO' })).toBe('v-go');
    expect(verdictClass({ ...RUN_DEV, verdict: 'NO-GO→corrigé' })).toBe('v-stop');
    expect(verdictClass({ ...RUN_CAD, verdict: 'en cours', live: true })).toBe('v-go');
    expect(verdictClass({ ...RUN_DEV, verdict: 'figé', live: false })).toBe('v-warn');
  });
});
