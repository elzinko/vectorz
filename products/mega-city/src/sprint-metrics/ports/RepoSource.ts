/** Port (DIP) : lecture repo (fiches `features/done/` + PR mergées) — jointure en lecture, zéro instrumentation. */

export interface ShippedFicheRecord {
  id: string;
  /** Date d'ajout à `features/done/` (proxy du ship). `undefined` si non datable. */
  mergedAt?: string;
}

export interface PrCommitRecord {
  authorType: 'agent' | 'unknown';
  isMergeCommit: boolean;
  isRebase: boolean;
  isFormatting: boolean;
}

export interface MergedPrRecord {
  mergedAt: string;
  commits: readonly PrCommitRecord[];
}

export interface RepoSource {
  listShippedFiches(repoRoot: string): ShippedFicheRecord[];
  listMergedPrs(repoRoot: string): MergedPrRecord[];
}
