/**
 * Tests de `session-onboarding.ts` — l'étape d'accueil de session (fiche
 * 20261015082118397, ADR-079 §D3). Le cœur est pur : on vérifie qu'il PROPOSE
 * sans jamais deviner, auto-confirme le cas net, et dégrade en autonome.
 */
import { describe, expect, it } from 'vitest';
import { proposeRattachement, type OpenChantier } from '../session-onboarding.js';

const CHANTIERS: OpenChantier[] = [
  { key: 'v0.18.0', branch: 'feat/board', version: 'v0.18.0' },
  { key: 'v0.19.0', branch: 'feat/gate', version: 'v0.19.0' },
];

describe('proposeRattachement', () => {
  it('débrayé par config : aucune proposition', () => {
    const r = proposeRattachement({ openChantiers: CHANTIERS, config: { enabled: false } });
    expect(r.kind).toBe('disabled');
  });

  it('aucun chantier ouvert : session autonome', () => {
    const r = proposeRattachement({ openChantiers: [] });
    expect(r.kind).toBe('autonomous');
  });

  it('cas net (branche = un seul chantier ouvert) : auto-confirme, sans deviner', () => {
    const r = proposeRattachement({ openChantiers: CHANTIERS, currentBranch: 'feat/board' });
    expect(r).toMatchObject({ kind: 'auto-confirm', chantierKey: 'v0.18.0' });
  });

  it('cas ambigu (branche sans correspondance nette) : PROPOSE, ne devine pas', () => {
    const r = proposeRattachement({ openChantiers: CHANTIERS, currentBranch: 'wip/essai-local' });
    expect(r.kind).toBe('ask');
    if (r.kind === 'ask') expect(r.candidates).toHaveLength(2);
  });

  it('branche inconnue : PROPOSE (rattachement à confirmer), jamais deviné', () => {
    const r = proposeRattachement({ openChantiers: CHANTIERS });
    expect(r.kind).toBe('ask');
  });

  it('auto-confirm débrayé : même un cas net est PROPOSÉ, pas confirmé en silence', () => {
    const r = proposeRattachement({
      openChantiers: CHANTIERS,
      currentBranch: 'feat/board',
      config: { autoConfirmOnBranchMatch: false },
    });
    expect(r.kind).toBe('ask');
  });
});
