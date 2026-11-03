import { describe, expect, it } from 'vitest';
import {
  prSansRetouche,
  summarizeBlockages,
  summarizePrRetouches,
  summarizeShippedFeatures,
  type PrCommitLike,
} from '../domain/kpi.js';

const window = { startTs: '2026-08-30T09:00:00.000Z', endTs: '2026-08-30T11:00:00.000Z' };

describe('summarizeShippedFeatures', () => {
  it('ne garde que les fiches livrées DANS la fenêtre, ids triés', () => {
    const fiches = [
      { id: 'b', mergedAt: '2026-08-30T10:00:00.000Z' },
      { id: 'a', mergedAt: '2026-08-30T09:30:00.000Z' },
      { id: 'hors-fenetre', mergedAt: '2026-08-29T09:30:00.000Z' },
      { id: 'sans-date' },
    ];
    expect(summarizeShippedFeatures(fiches, window)).toEqual({ count: 2, ids: ['a', 'b'] });
  });

  it('compare des instants : une date en heure locale compte selon son heure universelle (fiche 20261101131506082)', () => {
    // Fenêtre 00:05Z → 00:45Z. Git écrit en heure de Paris (+01:00).
    const fenetre = { startTs: '2026-11-03T00:05:36.453Z', endTs: '2026-11-03T00:45:44.439Z' };
    const fiches = [
      { id: 'avant', mergedAt: '2026-11-03T00:20:35+01:00' }, // = 2 nov. 23:20Z : avant la fenêtre
      { id: 'dedans', mergedAt: '2026-11-03T01:44:45+01:00' }, // = 00:44:45Z : dans la fenêtre
    ];
    expect(summarizeShippedFeatures(fiches, fenetre)).toEqual({ count: 1, ids: ['dedans'] });
  });

  it('lot connu : ne compte que ses fiches, livrées depuis l’ouverture, même après la fin de la fenêtre', () => {
    const fiches = [
      { id: 'du-lot', mergedAt: '2026-08-30T11:05:00.000Z' }, // livrée juste après le point de passage
      { id: 'autre-session', mergedAt: '2026-08-30T10:00:00.000Z' }, // dans la fenêtre, hors lot
      { id: 'du-lot-ancienne', mergedAt: '2026-08-29T10:00:00.000Z' }, // avant l'ouverture
    ];
    expect(summarizeShippedFeatures(fiches, window, ['du-lot', 'du-lot-ancienne'])).toEqual({ count: 1, ids: ['du-lot'] });
  });
});

describe('les trois compteurs comparent des instants (fiche 20261101131506082)', () => {
  it('une escalade datée en heure locale compte selon son instant', () => {
    const escalations = [{ ts: '2026-08-30T11:30:00+01:00', detail: '10 h 30 UTC' }];
    expect(summarizeBlockages(escalations, window).count).toBe(1);
  });

  it('une PR fusionnée pile à la borne, sans millisecondes, est dans la fenêtre', () => {
    const prs = [{ mergedAt: '2026-08-30T11:00:00Z', commits: [] }];
    expect(summarizePrRetouches(prs, window).total).toBe(1);
  });
});

describe('summarizeBlockages', () => {
  it('ne garde que les escalades DANS la fenêtre, triées par ts', () => {
    const escalations = [
      { ts: '2026-08-30T10:30:00.000Z', detail: 'second' },
      { ts: '2026-08-30T09:30:00.000Z', detail: 'first' },
      { ts: '2026-08-29T09:30:00.000Z', detail: 'hors fenêtre' },
    ];
    expect(summarizeBlockages(escalations, window)).toEqual({
      count: 2,
      events: [
        { ts: '2026-08-30T09:30:00.000Z', detail: 'first' },
        { ts: '2026-08-30T10:30:00.000Z', detail: 'second' },
      ],
    });
  });
});

const agentCommit = (over: Partial<PrCommitLike> = {}): PrCommitLike => ({
  authorType: 'agent',
  isMergeCommit: false,
  isRebase: false,
  isFormatting: false,
  ...over,
});

describe('prSansRetouche', () => {
  it('true quand rien de substantiel ne suit le dernier commit agent', () => {
    const commits = [agentCommit(), agentCommit({ isRebase: true })];
    expect(prSansRetouche(commits)).toBe(true);
  });

  it('null (indéterminable) quand aucun commit agent n’est identifié', () => {
    expect(prSansRetouche([{ authorType: 'unknown', isMergeCommit: false, isRebase: false, isFormatting: false }])).toBeNull();
  });

  it('null quand un commit substantiel suit le dernier commit agent', () => {
    const commits = [agentCommit(), { authorType: 'unknown' as const, isMergeCommit: false, isRebase: false, isFormatting: false }];
    expect(prSansRetouche(commits)).toBeNull();
  });
});

describe('summarizePrRetouches', () => {
  it('répartit les PR mergées DANS la fenêtre en sans-retouche / indéterminé', () => {
    const prs = [
      { mergedAt: '2026-08-30T09:30:00.000Z', commits: [agentCommit()] }, // sans retouche
      { mergedAt: '2026-08-30T10:30:00.000Z', commits: [] }, // indéterminé (pas de commit agent)
      { mergedAt: '2026-08-29T09:30:00.000Z', commits: [agentCommit()] }, // hors fenêtre
    ];
    expect(summarizePrRetouches(prs, window)).toEqual({ total: 2, sansRetouche: 1, indetermine: 1 });
  });
});
