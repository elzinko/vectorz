import type { BlockagesSummary, PrRetouchesSummary, ShippedFeaturesSummary } from './types.js';

/**
 * Vrai si `ts` tombe dans `]start, end]`, comparé comme un INSTANT. Git écrit ses dates en heure locale
 * (`…+01:00`), le journal et GitHub en heure universelle (`…Z`, avec ou sans millisecondes) : comparées
 * comme du texte, elles se rangent mal (fiche 20261101131506082). Une date illisible n'est jamais dedans.
 */
function inWindow(ts: string, window: { startTs: string; endTs: string }): boolean {
  const at = Date.parse(ts);
  return Number.isFinite(at) && at > Date.parse(window.startTs) && at <= Date.parse(window.endTs);
}

export interface ShippedFiche {
  id: string;
  mergedAt?: string;
}

/**
 * KPI (a) — fiches livrées : ids passés en `features/done/` pendant le sprint (fiche 20261101131506082).
 *
 * Les dates se comparent comme des INSTANTS : git les écrit en heure locale (`…+01:00`), le journal en
 * heure universelle (`…Z`). Comparées comme du texte, une livraison à 00 h 20 à Paris entrait dans une
 * fenêtre qui finissait à 00 h 45 UTC, et une livraison à 01 h 44 à Paris en sortait.
 *
 * Quand le lot scellé est connu, on ne compte que SES fiches, livrées depuis l'ouverture du sprint : le
 * compte rendu est écrit à la clôture, après les livraisons, et une fiche d'une autre session ne compte
 * pas. Sans lot, on compte ce qui a été livré dans la fenêtre. Pas de borne haute avec un lot : ses
 * fiches sont propres au sprint et une fiche n'est livrée qu'une fois, donc un rejeu tardif ne compte
 * rien de plus.
 */
export function summarizeShippedFeatures(
  fiches: readonly ShippedFiche[],
  window: { startTs: string; endTs: string },
  lotIds: readonly string[] = [],
): ShippedFeaturesSummary {
  const start = Date.parse(window.startTs);
  const end = Date.parse(window.endTs);
  const lot = new Set(lotIds);
  const ids = fiches
    .filter((f) => {
      const at = f.mergedAt === undefined ? Number.NaN : Date.parse(f.mergedAt);
      if (!Number.isFinite(at) || at <= start) return false;
      return lot.size > 0 ? lot.has(f.id) : at <= end;
    })
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
    .filter((e) => inWindow(e.ts, window))
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
  const merged = prs.filter((pr) => inWindow(pr.mergedAt, window));
  let sansRetouche = 0;
  let indetermine = 0;
  for (const pr of merged) {
    if (prSansRetouche(pr.commits) === true) sansRetouche += 1;
    else indetermine += 1;
  }
  return { total: merged.length, sansRetouche, indetermine };
}
