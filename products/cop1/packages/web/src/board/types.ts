/**
 * Board unifié cop1 (ADR-074) — modèle de données.
 *
 * Un *projet* porte UNE vérité : son entonnoir, ses métriques « depuis le début »,
 * ses versions (passées / en cours / à venir) et ses runs observés. Les vues du
 * board lisent toutes ce même objet — pas de métrique recalculée ailleurs.
 *
 * Tranche 20261012231419185 : coque + vue d'ensemble. La donnée est ici un modèle
 * typé (échantillon représentatif) ; le read-model réel (journal + backlog) le
 * remplira aux tranches suivantes sans changer ces types.
 */
import type { ProjectConfig } from './configModel.js';

/** Les quatre états d'une fiche dans le pipeline. */
export type FicheStatus = 'idea' | 'ready' | 'wip' | 'done';

/** Une version = un lot de fiches avec son décompte par état. */
export interface Version {
  ver: string;
  name: string;
  done: number;
  wip: number;
  ready: number;
  idea: number;
  total: number;
  /** Présent seulement pour une version taguée (passée). */
  date?: string;
  /** Jetons consommés, présent pour une version passée. */
  tok?: string;
}

/** Les versions d'un projet, rangées par place dans le train. */
export interface ProjectVersions {
  /** La version en cours (la plus basse non taguée), ou `null` si aucune. */
  current: Version | null;
  /** Les versions à venir, dans l'ordre du train. */
  upcoming: Version[];
  /** Les versions taguées, de la plus récente à la plus ancienne. */
  past: Version[];
}

/** L'entonnoir du pipeline actif d'un projet. */
export interface Funnel {
  idea: number;
  ready: number;
  wip: number;
  /** Fiches sans version assignée. */
  unversioned: number;
  /** Fiches parkées (hors plan). */
  parked: number;
}

/** Les métriques « depuis le début » d'un projet. */
export interface Metrics {
  done: number;
  tokens: string;
  temps: string;
  perFiche: string;
  sprints: number;
  runs: number;
  retros: number;
}

/** La lentille d'un run : côté cadrage, ou côté développement. */
export type RunKind = 'cadrage' | 'dev';

/** Une fiche traitée dans un moment, avec sa transition de statut. */
export interface FicheTransition {
  /** Id de fiche réelle (ouvre la modale), ou absent pour un libellé libre. */
  fid?: string;
  /** Titre libre quand il n'y a pas de fiche réelle. */
  t?: string;
  ver?: string;
  from: string;
  to: string;
}

/** Un moment d'un run = une étape de process (grooming, sprint, rétro…). */
export interface Moment {
  /** Clé d'étape : `grooming`, `sprint`, `release`, `retro`, `ready`, … */
  step: string;
  /** Numéro de sprint, pour les moments `sprint`. */
  n?: number;
  label?: string;
  tok?: string;
  /** Les fiches traitées à ce moment. */
  fiches: FicheTransition[];
}

/**
 * Un run observé (session de la méthode).
 *
 * Garde-fou ADR-079 : on ne grave pas « un run = une session ». Un run POURRA
 * réunir plusieurs sessions (champ `sessions`), pour étendre la vue plus tard au
 * lieu de la réécrire. La coque (fiche 185) ne lit que id/name/ver/live ; les
 * autres champs servent l'activité et le détail (fiche 211).
 */
export interface BoardRun {
  id: string;
  name: string;
  ver: string;
  /** `true` tant que le run est vivant : sa version est « en run ». */
  live: boolean;
  kind?: RunKind;
  date?: string;
  /** Temps compact affiché dans la ligne d'activité (« il y a 12 min », « 2 j »). */
  when?: string;
  verdict?: string;
  tok?: string;
  dur?: string;
  note?: string;
  moments?: Moment[];
  /** Sessions réunies par ce run (ADR-079) — facultatif, un run mono-session l'omet. */
  sessions?: string[];
}

/** Le type d'un évènement de chronologie. */
export type EventKind = 'sprint' | 'lancement' | 'tag' | 'retro' | 'gate';

/**
 * Vers quoi pointe un évènement cliquable : le run (ou le sprint, qui ouvre son
 * run). Les jalons non cliquables (version taguée, rétro…) n'ont pas de `ref`.
 */
export type TimelineRef = { type: 'run' | 'sprint'; id: string };

/**
 * Un évènement de chronologie : un jalon daté (run lancé, lot figé, version
 * taguée, rétro, sprint). Garde-fou ADR-079 : `session` est facultatif pour
 * porter plus tard un libellé de session, sans supposer « un run = une session ».
 */
export interface TimelineEvent {
  /** Temps compact affiché à gauche (« maintenant », « hier », « 2 j »). */
  when: string;
  kind: EventKind;
  ver?: string;
  title: string;
  tok?: string;
  cost?: 'lo' | 'mid' | 'hi';
  live?: boolean;
  /** Détail ouvert au clic ; absent = ligne non cliquable. */
  ref?: TimelineRef;
  /** Session réunie par ce jalon (ADR-079) — facultatif. */
  session?: string;
}

/** Une fiche en détail, telle que la modale la montre. */
export interface FicheDetail {
  id: string;
  title: string;
  prio: string;
  status: FicheStatus;
  ver: string;
  enclair: string;
  ctx: string;
  crit: string[];
  verif: string;
  pr?: string;
}

/** Un projet : la seule source de vérité de ses chiffres. */
export interface BoardProject {
  name: string;
  desc: string;
  live: boolean;
  funnel: Funnel;
  metrics: Metrics;
  versions: ProjectVersions;
  /** Les runs observés, indexés par id. */
  runs: Record<string, BoardRun>;
  /** Les fiches en détail, indexées par id (pour la modale fiche). Facultatif. */
  fiches?: Record<string, FicheDetail>;
  /** Les évènements de chronologie, du plus récent au plus ancien. Facultatif. */
  timeline?: TimelineEvent[];
  /** La config du projet (portée projet, `.vectorz/config.yml`). Facultatif. */
  config?: ProjectConfig;
}

/** L'ensemble des projets, indexés par leur nom (clé de navigation). */
export type BoardData = Record<string, BoardProject>;
