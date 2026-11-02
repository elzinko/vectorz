/**
 * planTypes — la forme du « plan » (entonnoir, versions, détail des fiches) que la page du board
 * attend déjà. Ces types ne lisent rien : le plan vient de la méthode (`ezk … --json`), traduit par
 * `ezkPlanTranslator`.
 */

/** L'entonnoir du pipeline actif (forme `Funnel` du board). */
export interface PlanFunnel {
  idea: number;
  ready: number;
  wip: number;
  unversioned: number;
  parked: number;
}

/** Une version = un lot de fiches avec son décompte par état (forme `Version` du board). */
export interface PlanVersion {
  ver: string;
  name: string;
  done: number;
  wip: number;
  ready: number;
  idea: number;
  total: number;
  date?: string;
}

export interface PlanVersions {
  current: PlanVersion | null;
  upcoming: PlanVersion[];
  past: PlanVersion[];
}

/** La part « plan » des données d'un projet pour le board (le reste — runs, live — vient du journal). */
export interface PlanData {
  funnel: PlanFunnel;
  versions: PlanVersions;
  /** Compte de fiches livrées (`metrics.done` du board). */
  done: number;
  /**
   * Ce que la méthode a mené : comptes rendus de sprint et captures de rétro (fiche 20261102104443762).
   * Absent quand la méthode installée ne le publie pas : la page dit « — », jamais un faux 0.
   */
  history?: { sprints: number; retros: number };
}

/** Les quatre états du board (identiques au type `FicheStatus` du web). */
export type FicheDetailStatus = 'idea' | 'ready' | 'wip' | 'done';

/** Le détail d'une fiche tel que la modale du board le montre (forme `FicheDetail` du web, ADR-074). */
export interface FicheDetailData {
  id: string;
  title: string;
  prio: string;
  status: FicheDetailStatus;
  ver: string;
  enclair: string;
  ctx: string;
  crit: string[];
  verif: string;
  pr?: string;
  /** Raison du blocage ; chaîne vide si la fiche n'est pas bloquée. */
  blocked: string;
}
