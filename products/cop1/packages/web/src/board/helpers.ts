/**
 * Board unifié cop1 — helpers purs sur le modèle de données.
 *
 * Aucune dépendance au DOM ni à React : des fonctions totales qui lisent un
 * projet et répondent une question (quelles versions, laquelle est en run,
 * est-elle cadrée…). Portées de la maquette de référence (ADR-074).
 */
import type { BoardProject, Version } from './types.js';

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

/** Une durée lisible ; `null` = non mesurée, dit en mots (fiche 20261104090517904). */
export function fmtDuree(ms: number | null): string {
  if (ms === null) return 'non mesurée';
  const min = Math.max(1, Math.round(ms / 60_000));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

/** Des jetons lisibles ; `null` = non mesurés, dit en mots. */
export function fmtTokens(n: number | null): string {
  if (n === null) return 'non mesurés';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(n);
}
