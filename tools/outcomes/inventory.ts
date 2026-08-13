/**
 * Fiche 0044 — AC1 : inventaire des données réellement disponibles pour la
 * baseline. Lecture seule, ne modifie rien.
 */
import type { RepoSource } from './sources.js';

export interface Inventory {
  mergedAgentPrCount: number;
  doneFicheCount: number;
  supervisionRunsAvailable: boolean;
  supervisionRunsConformCount: number;
}

export function buildInventory(source: RepoSource): Inventory {
  const runs = source.listSupervisionRuns();
  return {
    mergedAgentPrCount: source.countMergedAgentPrs(),
    doneFicheCount: source.listDoneFiches().length,
    supervisionRunsAvailable: runs.length > 0,
    supervisionRunsConformCount: runs.filter((r) => r.conforms).length,
  };
}
