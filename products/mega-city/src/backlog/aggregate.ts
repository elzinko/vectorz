import type { Fiche } from '../loaders/fiches.js';

/**
 * aggregate — le moteur `script` de `ezk-backlog aggregate` (fiche 20260812104022240,
 * ADR-0051). PUR (ADR-0003) : zéro I/O, déterministe. Il **propose** des clusters de
 * fiches actives qui se recoupent — jamais d'application (statuts/index inchangés).
 *
 * Périmètre STRICT de ce cœur : le clustering mécanique. Hors périmètre (gated ailleurs) :
 * appliquer `merged`/`split` (fiche 20260823121712652), parser `depends:`, backfiller les tags.
 */

export type ClusterReason = 'label' | 'epic' | 'title-prefix';

export interface AggregateCluster {
  key: string;
  reason: ClusterReason;
  /** Ids de fiches du cluster, triés — taille toujours ≥ 2 (un cluster de 1 est un singleton). */
  ficheIds: string[];
}

export interface AggregateCoverage {
  /** Fiches actives non-épic considérées. */
  total: number;
  /** Parmi elles, celles portant au moins un `labels:`. */
  tagged: number;
  /** Parmi elles, celles tombées dans au moins un cluster (toutes raisons confondues). */
  clustered: number;
}

export interface AggregateReport {
  scope: string;
  coverage: AggregateCoverage;
  clusters: AggregateCluster[];
  singletons: string[];
}

const REASON_ORDER: readonly ClusterReason[] = ['label', 'epic', 'title-prefix'];

/** Restreint la passe : `all` (défaut) | un produit | un seau de priorité `Pn` | `epic:<id>`. */
export function selectScope(fiches: Fiche[], scope: string): Fiche[] {
  if (scope === 'all') return fiches;
  if (/^P[0-3]$/.test(scope)) return fiches.filter((f) => f.priority === scope);
  if (scope.startsWith('epic:')) {
    const epicId = scope.slice('epic:'.length);
    return fiches.filter((f) => f.epic === epicId);
  }
  return fiches.filter((f) => f.product === scope);
}

/** 1er token du titre, normalisé (minuscule, ponctuation ignorée) — '' si aucun. */
function titlePrefixKey(title: string): string {
  const match = title.trim().toLowerCase().match(/[\p{L}\p{N}]+/u);
  return match ? match[0] : '';
}

/** Regroupe des ids par clé, ne garde que les groupes de taille ≥ 2, triés (clé puis ids). */
function buildClusters(
  reason: ClusterReason,
  keysByFicheId: Iterable<[string, string]>,
): AggregateCluster[] {
  const idsByKey = new Map<string, string[]>();
  for (const [key, ficheId] of keysByFicheId) {
    if (!key) continue;
    const bucket = idsByKey.get(key);
    if (bucket) bucket.push(ficheId);
    else idsByKey.set(key, [ficheId]);
  }
  const clusters: AggregateCluster[] = [];
  for (const [key, ids] of idsByKey) {
    const ficheIds = [...new Set(ids)].sort();
    if (ficheIds.length >= 2) clusters.push({ key, reason, ficheIds });
  }
  return clusters;
}

/**
 * Clustering déterministe sur les fiches **actives non-épic** (exclut `f.done` et
 * `type: epic`) : label partagé (multi-appartenance), enfants d'un même épic, et
 * heuristique de 1er mot du titre. `product:` reste un critère de scope, pas une clé
 * de cluster. Sortie triée (clusters, ficheIds, singletons) → stable quel que soit
 * l'ordre d'entrée.
 */
export function aggregateByScript(fiches: Fiche[]): AggregateReport {
  const active = fiches.filter((f) => !f.done && f.type !== 'epic');

  const labelPairs: Array<[string, string]> = [];
  for (const f of active) for (const label of f.labels) labelPairs.push([label, f.id]);
  const epicPairs: Array<[string, string]> = active.map((f) => [f.epic, f.id]);
  const titlePairs: Array<[string, string]> = active.map((f) => [titlePrefixKey(f.title), f.id]);

  const clusters = [
    ...buildClusters('label', labelPairs),
    ...buildClusters('epic', epicPairs),
    ...buildClusters('title-prefix', titlePairs),
  ].sort((a, b) => {
    const byReason = REASON_ORDER.indexOf(a.reason) - REASON_ORDER.indexOf(b.reason);
    return byReason !== 0 ? byReason : a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  const clusteredIds = new Set(clusters.flatMap((c) => c.ficheIds));
  const singletons = active.filter((f) => !clusteredIds.has(f.id)).map((f) => f.id).sort();

  return {
    scope: 'all',
    coverage: {
      total: active.length,
      tagged: active.filter((f) => f.labels.length > 0).length,
      clustered: clusteredIds.size,
    },
    clusters,
    singletons,
  };
}
