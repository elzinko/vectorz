import { describe, expect, it } from 'vitest';
import { attributeTokens } from '../domain/tokens.js';

const window = { startTs: '2026-08-30T09:00:00.000Z', endTs: '2026-08-30T11:00:00.000Z' };

describe('attributeTokens', () => {
  it('grain sprint : ne somme que les usages DANS la fenêtre', () => {
    const events = [
      { ts: '2026-08-30T08:00:00.000Z', sessionId: 's1', inputTokens: 999, outputTokens: 999 }, // hors fenêtre (avant)
      { ts: '2026-08-30T09:30:00.000Z', sessionId: 's1', inputTokens: 100, outputTokens: 50 },
      { ts: '2026-08-30T10:30:00.000Z', sessionId: 's1', inputTokens: 200, outputTokens: 20 },
      { ts: '2026-08-30T12:00:00.000Z', sessionId: 's1', inputTokens: 999, outputTokens: 999 }, // hors fenêtre (après)
    ];
    const result = attributeTokens(events, window);
    expect(result).toEqual({
      grain: 'sprint',
      inputTokens: 300,
      outputTokens: 70,
      totalTokens: 370,
    });
  });

  it('borne semi-ouverte (startTs, endTs] : un usage pile sur le checkpoint de DÉBUT est exclu, celui de FIN inclus', () => {
    // La frontière partagée entre deux sprints (endTs du précédent = startTs du suivant)
    // ne doit compter QUE pour le sprint qui se termine — sinon double comptage silencieux.
    const events = [
      { ts: window.startTs, sessionId: 's1', inputTokens: 1000, outputTokens: 1000 }, // pile sur startTs → exclu
      { ts: window.endTs, sessionId: 's1', inputTokens: 7, outputTokens: 3 }, // pile sur endTs → inclus
    ];
    const result = attributeTokens(events, window);
    expect(result).toEqual({ grain: 'sprint', inputTokens: 7, outputTokens: 3, totalTokens: 10 });
  });

  it('repli grain session (somme du run entier) et étiquette la note quand la fenêtre est vide', () => {
    const events = [
      { ts: '2026-08-30T07:00:00.000Z', sessionId: 's1', inputTokens: 10, outputTokens: 5 },
      { ts: '2026-08-30T13:00:00.000Z', sessionId: 's1', inputTokens: 20, outputTokens: 5 },
    ];
    const result = attributeTokens(events, window);
    expect(result.grain).toBe('session');
    expect(result.totalTokens).toBe(40);
    expect(result.note).toMatch(/repli/i);
  });

  it('aucun événement du tout → repli session à zéro (jamais d’exception)', () => {
    const result = attributeTokens([], window);
    expect(result).toEqual({ grain: 'session', inputTokens: 0, outputTokens: 0, totalTokens: 0, note: expect.any(String) });
  });
});
