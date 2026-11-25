import { describe, expect, it } from 'vitest';
import { momentLabel, verdictClass } from './activity.js';
import type { BoardRun } from './types.js';

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
