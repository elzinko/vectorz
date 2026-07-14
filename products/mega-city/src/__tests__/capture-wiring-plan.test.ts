import { describe, expect, it } from 'vitest';
import { planCapture } from '../core/capture.js';

const DATE = '2026-07-02';

/**
 * Fiche 0013 — DoD : le calcul du câblage reste PUR (agentWiring calculé sans disque).
 * planCapture reçoit l'agent cible en option et calcule l'INTENTION de câblage ;
 * la lecture + mutation vit dans la coquille I/O.
 */
describe('planCapture — intention de câblage agent (fiche 0013, pur)', () => {
  it('kind=interaction --for <agent> → agentWiring vers interactions[]', () => {
    const plan = planCapture('handoff/qa-to-dev', 'interaction', '# corps', DATE, '', 'ezk-reviewer');
    expect(plan.agentWiring).toEqual({
      agentPath: 'agents/ezk-reviewer.md',
      listField: 'interactions',
      idToAdd: 'handoff/qa-to-dev',
    });
  });

  it('kind=skill --for <agent> → agentWiring vers competences[]', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE, '', 'ezk-reviewer');
    expect(plan.agentWiring).toEqual({
      agentPath: 'agents/ezk-bisect.md'.replace('ezk-bisect', 'ezk-reviewer'),
      listField: 'competences',
      idToAdd: 'ezk-bisect',
    });
  });

  it('sans --for → pas de câblage (agentWiring absent)', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    expect(plan.agentWiring).toBeUndefined();
  });

  it("valide l'id de l'agent cible (assertSafeId, anti-traversal)", () => {
    expect(() => planCapture('x', 'interaction', '# c', DATE, '', '../escape')).toThrow(/non sûr/i);
  });

  it('reste déterministe : mêmes args → plan identique', () => {
    const a = planCapture('handoff/qa-to-dev', 'interaction', '# c', DATE, '', 'ezk-reviewer');
    const b = planCapture('handoff/qa-to-dev', 'interaction', '# c', DATE, '', 'ezk-reviewer');
    expect(a).toEqual(b);
  });
});
