import type { SprintWindow } from './types.js';

export interface SprintCheckpoint {
  ts: string;
  slug: string;
}

/**
 * Frontières de sprint = jointure en LECTURE sur les gates `sprint-<slug>-checkpoint`
 * du journal de supervision (zéro instrumentation neuve). Le checkpoint DE ce sprint
 * marque la fin ; le début est le checkpoint le plus récent qui le précède, ou
 * `fallbackStartTs` (ex. `run.started`) quand ce sprint est le premier de la session.
 *
 * Retourne `null` si aucun checkpoint ne porte ce slug (rien à dater).
 */
export function computeSprintWindow(
  checkpoints: readonly SprintCheckpoint[],
  slug: string,
  fallbackStartTs?: string,
): SprintWindow | null {
  const sorted = [...checkpoints].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  const idx = sorted.findIndex((c) => c.slug === slug);
  if (idx === -1) return null;

  const endTs = sorted[idx].ts;
  const startTs = idx > 0 ? sorted[idx - 1].ts : (fallbackStartTs ?? endTs);
  const durationMs = Math.max(0, Date.parse(endTs) - Date.parse(startTs));
  return { startTs, endTs, durationMs };
}
