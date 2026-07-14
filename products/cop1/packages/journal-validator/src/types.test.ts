import { describe, expect, it } from 'vitest';
import type { Envelope } from './types.js';

describe('Envelope', () => {
  it('exige un champ "contract" (parité avec REQUIRED_ENVELOPE_FIELDS de readEnvelopes)', () => {
    const envelope: Envelope = {
      event_id: 'e1',
      run_id: 'r1',
      seq: 1,
      ts: new Date().toISOString(),
      contract: 'cop1/supervisability@0.1',
      type: 'run.started',
      payload: {},
    };

    expect(envelope.contract).toBe('cop1/supervisability@0.1');
  });
});
