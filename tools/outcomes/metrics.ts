/**
 * Fiche 0044 — métriques PURES, déterministes, ZÉRO I/O.
 *
 * PROVISOIRE tant qu'ADR-030 n'est pas ratifié : le point de handoff et la
 * fenêtre de reprise sont des seuils PO provisoires (cf. README.md).
 */
import type { PrCommit } from './sources.js';

/** Fenêtre de requalification « reprise post-merge » (jours). Seuil PO provisoire. */
export const REPRISE_WINDOW_DAYS = 3;

/**
 * Point de handoff (PROVISOIRE) : index du dernier commit d'auteur agent.
 * -1 si aucun commit agent trouvé (aucun handoff identifiable).
 */
export function findHandoffIndex(commits: readonly PrCommit[]): number {
  for (let i = commits.length - 1; i >= 0; i -= 1) {
    if (commits[i]?.authorType === 'agent') return i;
  }
  return -1;
}

/**
 * AC3 — « PR sans retouche » : aucun commit SUBSTANTIEL après le handoff
 * (rebase, formatage et merge exclus). Retourne `boolean | null` :
 *  - `null` (INDÉTERMINABLE) si aucun commit agent n'est identifié (pas de
 *    handoff localisable), OU s'il existe des commits substantiels post-handoff
 *    d'auteur `unknown` — on ne peut PAS confirmer une retouche humaine faute de
 *    signal d'auteur fiable (identité git unique, trailer non systématique, 0176) ;
 *  - `true` si rien de substantiel ne suit le dernier commit agent.
 * On ne renvoie jamais `false` : « retouche humaine » n'est pas confirmable ici.
 */
export function prSansRetouche(commits: readonly PrCommit[]): boolean | null {
  const handoffIndex = findHandoffIndex(commits);
  if (handoffIndex === -1) return null; // aucun commit agent identifié
  const postHandoff = commits.slice(handoffIndex + 1);
  const retouches = postHandoff.filter((c) => !c.isRebase && !c.isFormatting && !c.isMergeCommit);
  if (retouches.length === 0) return true;
  return null; // commits substantiels d'auteur indéterminé → non confirmable
}

/** AC: temps_de_cycle = jours entre front-matter `created` et le squash-merge. */
export function tempsDeCycle(createdIso: string, mergedAtIso: string): number | null {
  const createdMs = Date.parse(createdIso);
  const mergedMs = Date.parse(mergedAtIso);
  if (Number.isNaN(createdMs) || Number.isNaN(mergedMs)) return null;
  return Math.round((mergedMs - createdMs) / (1000 * 60 * 60 * 24));
}

export interface ReprenableCase {
  files: readonly string[];
  ficheId?: string;
  mergedAt: string;
}

/**
 * AC4 — signal « reprise post-merge » : un correctif sur les MÊMES fichiers
 * OU la MÊME fiche, sous X jours (REPRISE_WINDOW_DAYS), requalifie le cas
 * original comme reproduit.
 */
export function reprisePostMerge(
  original: ReprenableCase,
  correctif: ReprenableCase,
  windowDays: number = REPRISE_WINDOW_DAYS,
): boolean {
  const sameFiche = original.ficheId !== undefined && original.ficheId === correctif.ficheId;
  const sameFiles = original.files.some((f) => correctif.files.includes(f));
  if (!sameFiche && !sameFiles) return false;

  const originalMs = Date.parse(original.mergedAt);
  const correctifMs = Date.parse(correctif.mergedAt);
  if (Number.isNaN(originalMs) || Number.isNaN(correctifMs)) return false;

  const deltaDays = (correctifMs - originalMs) / (1000 * 60 * 60 * 24);
  return deltaDays >= 0 && deltaDays <= windowDays;
}
