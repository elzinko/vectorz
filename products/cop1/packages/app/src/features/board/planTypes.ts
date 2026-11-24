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
  /** La méthode dit ce lot « à clore » : toutes ses fiches sont livrées, l'étiquette manque. */
  toClose?: true;
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
  /**
   * Les derniers sprints et leurs indicateurs, tels que la méthode les publie (fiche 20261104090517904).
   * Absent quand la méthode installée ne les publie pas.
   */
  lastSprints?: PlanSprint[];
  /**
   * L'avancement par milestone et les sessions closes, tels que la méthode les publie (fiche
   * 20261102123552182). Absent quand la méthode installée ne publie pas les sessions : la vue
   * « Pilotage » le dit, jamais une liste vide présentée comme réelle.
   */
  pilotage?: PlanPilotage;
  /**
   * Les objectifs tels que la méthode les publie, dans son ordre (fiche 20261124111115865). Absent
   * quand la méthode installée ne les publie pas, ou qu'une entrée est mal formée : la page le dit.
   */
  objectifs?: PlanObjectif[];
  /**
   * Les versions et la prochaine coupe, telles que la méthode les publie (fiche 20261124111115783).
   * Absent quand la méthode installée ne les publie pas en entier : la page le dit.
   */
  versionsPage?: PlanVersionsPage;
}

/** Un objectif (une milestone) en entier : ce que les pages Objectifs et Un objectif montrent. */
export interface PlanObjectif {
  /** Le slug, valeur exacte du champ `milestone:` des fiches. */
  slug: string;
  /** Le nom en clair déclaré dans `features/milestones/<slug>.md` ; `null` s'il n'est pas publié. */
  nom: string | null;
  status: string;
  total: number;
  shipped: number;
  /** Le décompte par état publié (`idea`, `ready`, `shipped`…). */
  counts: Record<string, number>;
  /** Les fiches actives, hors livrées, triées. */
  aFaire: string[];
  livrees: string[];
  versions: string[];
}

/** Un lot de version en entier (`versions.lots[]` de `ezk board show --json`). */
export interface PlanVersionLot {
  version: string;
  /** Le nom en clair déclaré dans `features/versions/<v>.md` ; `null` s'il n'est pas publié. */
  nom: string | null;
  milestones: string[];
  etat: string;
  cycleDeVie: string;
  etiquette: string | null;
  dateEtiquette: string | null;
  livrees: string[];
  aFaire: string[];
  pretes: string[];
  bloquees: string[];
}

/** Une passe de la gate de release. */
export interface PlanGatePass {
  id: string;
  title: string;
  go: boolean;
  sautee: boolean;
}

/** Ce qui attend la prochaine coupe (`versions.prochaineCoupe`). `null` = non publié. */
export interface PlanProchaineCoupe {
  derniereEtiquette: string | null;
  livrees: { id: string; titre: string; objectif: string }[];
  nombre: number | null;
  gate: { version: string; verdict: 'GO' | 'NO-GO'; date: string; passes: PlanGatePass[] } | null;
  numeroPropose: string | null;
}

export interface PlanVersionsPage {
  /** Dans l'ordre du contrat : croissant. */
  lots: PlanVersionLot[];
  prochaineCoupe: PlanProchaineCoupe;
}

/** Une milestone et son avancement (`milestones` de `ezk board show --json`). */
export interface PlanMilestone {
  name: string;
  status: string;
  total: number;
  shipped: number;
}

/** Une session close (`sessions` de `ezk board show --json`), la plus récente d'abord. */
export interface PlanSession {
  date: string;
  title: string;
  file: string;
  fiches: string[];
  prs: string[];
}

export interface PlanPilotage {
  milestones: PlanMilestone[];
  sessions: PlanSession[];
}

/** Les quatre états du board (identiques au type `FicheStatus` du web). */
export type FicheDetailStatus = 'idea' | 'ready' | 'wip' | 'done' | 'parked';

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
  /** Le pouce de revue posé (fiche 20261102151630248) ; absent s'il n'y en a pas. */
  verdict?: 'up' | 'down';
}

/** Un sprint résumé par la méthode. `null` = non mesuré par son compte rendu, jamais un faux zéro. */
export interface PlanSprint {
  slug: string;
  fichier: string;
  jour: string;
  fin: string | null;
  dureeMs: number | null;
  tokens: number | null;
  livrees: { id: string; title: string }[];
  blocages: number | null;
  /** Le numéro continu, le but et la branche, quand la méthode les publie (fiche 20261114131612204). */
  numero?: number;
  but?: string;
  branche?: string;
}
