import type { SprintWindow } from './types.js';

export interface SprintCheckpoint {
  ts: string;
  slug: string;
  /** Le run du journal qui porte ce checkpoint (fiche 20261002230039863). */
  runId: string;
}

/**
 * Frontières de sprint = jointure en LECTURE sur les gates `sprint-<slug>-checkpoint`
 * du journal de supervision (zéro instrumentation neuve). Le checkpoint DE ce sprint
 * marque la fin ; le début est le checkpoint qui le précède DANS LE MÊME RUN, sinon le démarrage de
 * ce run (`runStart`). Jamais un checkpoint d'un autre run : un compte rendu disait 390 h pour une
 * soirée en partant du checkpoint d'un run ancien (fiche 20261101131506082).
 *
 * Appariement (fiche 20261002230039863) — par l'ID DU RUN, pas par l'égalité des slugs (fragile) :
 *   - on préfère d'abord un checkpoint dont le slug correspond (redater un vieux sprint par son slug) ;
 *   - sinon, on se restreint au RUN COURANT (`currentRunId`, le run qu'on vient de clore) et on prend
 *     son dernier checkpoint. Ainsi le compte rendu est daté même quand le slug du gate diffère de
 *     celui de l'objectif (symptôme 2026-10-11), SANS emprunter le checkpoint d'un vieux run sans
 *     rapport (ce qui daterait faux et déclencherait un scan inutile).
 *
 * Retourne `null` quand rien ne date ce sprint : aucun checkpoint du tout, ou — faute de slug — le run
 * courant n'en porte aucun. `close` tombe alors sur son rapport NON DATÉ (lot seulement), rapide.
 */
export function computeSprintWindow(
  checkpoints: readonly SprintCheckpoint[],
  slug: string,
  runStart?: (runId: string) => string | undefined,
  currentRunId?: string,
): SprintWindow | null {
  const sorted = [...checkpoints].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  if (sorted.length === 0) return null;

  let idx = sorted.findIndex((c) => c.slug === slug);
  if (idx === -1) {
    // Pas de slug : le dernier checkpoint DU RUN COURANT (jamais un autre run).
    const scope = currentRunId ?? sorted[sorted.length - 1].runId;
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      if (sorted[i].runId === scope) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return null; // le run courant n'a aucun checkpoint de sprint → non daté
  }

  const end = sorted[idx];
  const endTs = end.ts;
  const previous = sorted.slice(0, idx).filter((c) => c.runId === end.runId).at(-1);
  const startTs = previous?.ts ?? runStart?.(end.runId) ?? endTs;
  const durationMs = Math.max(0, Date.parse(endTs) - Date.parse(startTs));
  return { startTs, endTs, durationMs };
}
