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
