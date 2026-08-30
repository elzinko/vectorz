import type { BlockagesSummary, PrRetouchesSummary, ShippedFeaturesSummary } from './types.js';

export interface ShippedFiche {
  id: string;
  mergedAt?: string;
}

/** KPI (a) — fiches livrées : ids passés en `features/done/` dans la fenêtre du sprint. */
export function summarizeShippedFeatures(
  fiches: readonly ShippedFiche[],
  window: { startTs: string; endTs: string },
): ShippedFeaturesSummary {
  const ids = fiches
    .filter((f) => f.mergedAt !== undefined && f.mergedAt > window.startTs && f.mergedAt <= window.endTs)
    .map((f) => f.id)
    .sort();
  return { count: ids.length, ids };
}

export interface BlockedEscalation {
  ts: string;
  detail?: string;
}

/** KPI (c) — blocages : événements `escalate{type:"blocked"}` du journal, fenêtrés. */
export function summarizeBlockages(
  escalations: readonly BlockedEscalation[],
  window: { startTs: string; endTs: string },
): BlockagesSummary {
  const events = escalations
    .filter((e) => e.ts > window.startTs && e.ts <= window.endTs)
    .map((e) => ({ ts: e.ts, detail: e.detail }))
    .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  return { count: events.length, events };
}

// --- KPI (b) — retouches PR --------------------------------------------------
// Copie ADAPTÉE des fonctions PURES de `tools/outcomes/metrics.ts` (fiche
// done/0044) : POC = recopie assumée, pas d'import produit→racine en dur.
// `findHandoffIndex`/`prSansRetouche` gardent le même comportement.

export interface PrCommitLike {
  authorType: 'agent' | 'unknown';
  isMergeCommit: boolean;
  isRebase: boolean;
  isFormatting: boolean;
}

export interface MergedPrLike {
  mergedAt: string;
  commits: readonly PrCommitLike[];
}

function findHandoffIndex(commits: readonly PrCommitLike[]): number {
  for (let i = commits.length - 1; i >= 0; i -= 1) {
    if (commits[i]?.authorType === 'agent') return i;
  }
  return -1;
}

/**
 * `true` : aucun commit substantiel après le dernier commit d'agent (rebase,
 * formatage, merge exclus). `null` : indéterminable (pas de commit agent
 * identifié, ou retouche substantielle d'auteur non confirmé). Jamais `false`
 * (une retouche humaine n'est pas confirmable ici, cf. metrics.ts original).
 */
export function prSansRetouche(commits: readonly PrCommitLike[]): boolean | null {
  const handoffIndex = findHandoffIndex(commits);
  if (handoffIndex === -1) return null;
  const postHandoff = commits.slice(handoffIndex + 1);
  const retouches = postHandoff.filter((c) => !c.isRebase && !c.isFormatting && !c.isMergeCommit);
  return retouches.length === 0 ? true : null;
}

/** KPI (b) — retouches PR : PR mergées dans la fenêtre, réparties sans-retouche / indéterminé. */
export function summarizePrRetouches(
  prs: readonly MergedPrLike[],
  window: { startTs: string; endTs: string },
): PrRetouchesSummary {
  const inWindow = prs.filter((pr) => pr.mergedAt > window.startTs && pr.mergedAt <= window.endTs);
  let sansRetouche = 0;
  let indetermine = 0;
  for (const pr of inWindow) {
    if (prSansRetouche(pr.commits) === true) sansRetouche += 1;
    else indetermine += 1;
  }
  return { total: inWindow.length, sansRetouche, indetermine };
}
