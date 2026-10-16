/**
 * Board unifié cop1 — helpers purs sur le modèle de données.
 *
 * Aucune dépendance au DOM ni à React : des fonctions totales qui lisent un
 * projet et répondent une question (quelles versions, laquelle est en run,
 * est-elle cadrée…). Portées de la maquette de référence (ADR-074).
 */
import type { BoardProject, BoardRun, Version } from './types.js';

/** Nombre de fiches « groomées » (prêtes ou plus avancées) d'une version. */
export function groomed(v: Version): number {
  return v.done + v.wip + v.ready;
}

/** Une version est *cadrée* quand tout son lot est groomé. */
export function cadre(v: Version): boolean {
  return v.total > 0 && groomed(v) === v.total;
}

/** Clé de tri sémantique d'une version : `[major, minor, patch]`. */
export function svKey(ver: string): [number, number, number] {
  const m = (ver || '').replace(/^v/i, '').match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  return m ? [+m[1], +m[2], +(m[3] || 0)] : [9999, 9999, 9999];
}

/** Compare deux versions dans l'ordre du train (croissant). */
export function svCmp(a: string, b: string): number {
  const ka = svKey(a);
  const kb = svKey(b);
  for (let i = 0; i < 3; i++) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return (a || '~').localeCompare(b || '~');
}

/** Toutes les versions d'un projet, dans l'ordre d'affichage (courante, à venir, passées). */
export function allVersions(p: BoardProject): Version[] {
  const V = p.versions;
  const out: Version[] = [];
  if (V.current) out.push(V.current);
  V.upcoming.forEach((v) => out.push(v));
  V.past.forEach((v) => out.push(v));
  return out;
}

/** Vrai si `ver` est la version en cours du projet. */
export function isCurVer(p: BoardProject, ver: string): boolean {
  return p.versions.current?.ver === ver;
}

/** Vrai si `ver` est une version taguée (passée). */
export function isPastVer(p: BoardProject, ver: string): boolean {
  return p.versions.past.some((v) => v.ver === ver);
}

/** La catégorie d'une version : à venir, en cours, ou réalisée. */
export type VersionCategory = 'avenir' | 'encours' | 'realisees';

/** Range une version par catégorie, ou `null` si inconnue. */
export function verCat(p: BoardProject, ver: string | undefined): VersionCategory | null {
  if (!ver) return null;
  if (p.versions.past.some((v) => v.ver === ver)) return 'realisees';
  if (p.versions.current?.ver === ver) return 'encours';
  if (p.versions.upcoming.some((v) => v.ver === ver)) return 'avenir';
  return null;
}

/** Les runs vivants du projet. */
export function liveRuns(p: BoardProject): BoardRun[] {
  return Object.values(p.runs).filter((r) => r.live);
}

/**
 * Indexe le run vivant par version. Une version n'a qu'un run vivant au plus ;
 * s'il y en a plusieurs (donnée incohérente), le premier rencontré gagne.
 */
export function runByVer(p: BoardProject): Record<string, BoardRun> {
  const out: Record<string, BoardRun> = {};
  for (const r of liveRuns(p)) {
    if (!out[r.ver]) out[r.ver] = r;
  }
  return out;
}
