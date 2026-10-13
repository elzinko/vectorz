import { describe, expect, it } from 'vitest';
import { BLOCKED_REASONS, blockedType, isKnownBlockedReason } from '../blocked-reasons.js';

describe('blocked-reasons — raisons typées du drapeau blocked: (fiche 20261013131632484)', () => {
  it('blockedType extrait le 1er segment (avant " — "), le contexte reste libre', () => {
    expect(blockedType('différée-PO — attend 3 décisions PO')).toBe('différée-PO');
    expect(blockedType('attend-GitHub')).toBe('attend-GitHub');
    expect(blockedType('')).toBe('');
  });

  it('isKnownBlockedReason : vide = non bloquée (vrai), type connu (vrai), inconnu (faux)', () => {
    expect(isKnownBlockedReason('')).toBe(true); // fiche non bloquée : rien à valider
    expect(isKnownBlockedReason('différée-PO — contexte')).toBe(true);
    expect(isKnownBlockedReason('attend-panel')).toBe(true);
    expect(isKnownBlockedReason('inconnu-xyz — y')).toBe(false);
    expect(isKnownBlockedReason('Différée-PO')).toBe(false); // casse stricte : pas de typo silencieuse
  });

  it('la liste fermée porte les raisons citées par la fiche', () => {
    for (const r of ['différée-PO', 'attend-maquette', 'attend-GitHub'])
      expect(BLOCKED_REASONS as readonly string[]).toContain(r);
  });
});
