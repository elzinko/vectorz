import { describe, expect, it } from 'vitest';
import { BLOCKED_REASONS, blockedType, isKnownBlockedReason } from '../blocked-reasons.js';

describe('blocked-reasons — raisons typées du drapeau blocked: (fiche 20261013131632484)', () => {
  it('blockedType extrait le 1er segment (avant " — "), le contexte reste libre', () => {
    expect(blockedType('deferred — attend 3 décisions PO')).toBe('deferred');
    expect(blockedType('github')).toBe('github');
    expect(blockedType('')).toBe('');
  });

  it('isKnownBlockedReason : vide = non bloquée (vrai), type connu (vrai), inconnu (faux)', () => {
    expect(isKnownBlockedReason('')).toBe(true); // fiche non bloquée : rien à valider
    expect(isKnownBlockedReason('deferred — contexte')).toBe(true);
    expect(isKnownBlockedReason('panel')).toBe(true);
    expect(isKnownBlockedReason('inconnu-xyz — y')).toBe(false);
    expect(isKnownBlockedReason('Différée-PO')).toBe(false); // casse stricte : pas de typo silencieuse
  });

  it('la liste fermée porte les raisons citées par la fiche', () => {
    for (const r of ['deferred', 'design', 'github'])
      expect(BLOCKED_REASONS as readonly string[]).toContain(r);
  });
});
